#!/usr/bin/env node
// Process tasks from the work queue
var amqp = require('amqplib');

var fs = require('fs');
var q = require('q');
//CONFIGS

var assertBuilder = require('./services/assertBuilderService');
var testRepository = require('./repositories/testRepository');
var scheduleRepository = require('./repositories/scheduleRepository');
var resultPersistenceService = require('./services/testResultPersistenceService');


var PREFETCH_NUMBER = 1;

var queueConfiguration = {
	name: "youcantest.test_queue",
	options: {
		durable: false
	}
};

function execute(testId) {
	return testRepository.getById(testId).then(function (object) {
		var defer = assertBuilder.executeTestSequence(object);

		return defer.then(function (obj) {
			console.log(obj.dones, obj.errors);

			console.log("terminei todos os testes");
			console.log("[x] Done");

			return obj;
		}, function () {
			console.log("fuck!");
		}).then(function (obj) {
			assertBuilder.finishTestSequence();
			return obj;
		});
	});
};

(function (queueContext) {
	queueContext.connect('amqp://localhost').then(function (conn) {
		process.once('SIGINT', function () {
			conn.close();
		});

		return conn.createChannel().then(function (channel) {
			var queue = channel.assertQueue(queueConfiguration.name, queueConfiguration.options);

			queue = queue.then(function () {
				channel.prefetch(PREFETCH_NUMBER);
			});
			queue = queue.then(function () {
				channel.consume(queueConfiguration.name, doWorkFn, {
						noAck: false
					}
				);

				console.log(" [*] Waiting for messages. To exit press CTRL+C");
			});

			return queue;

			function doWorkFn(message) {
				console.log(" [x] message received");

				var bodyStr = message.content.toString();

				var messageContent = JSON.parse(bodyStr);

				if (!messageContent || !messageContent.scheduleId) {
					throw "undefined schedule";
					return;
				}

				try {
					//getting test from db
					scheduleRepository.getById(messageContent.scheduleId).then(function (data) {
						if (data.length == 0 || !data.testId)
							throw "error to get schedule";
						execute(data.testId).then(function (obj) {

							resultPersistenceService.saveResults(messageContent.scheduleId, obj.dones, obj.errors).then(function(id) {
								data.resultId = id;
								data.executionDate = new Date();
								scheduleRepository.saveOne(data);
							});

							channel.ack(message);
							console.log("scheduleId : " + messageContent.scheduleId + "  done");
						}, function (err) {
							throw "error to get test";
						});
					}, function () {
						throw "error to get test";
					});
				}
				catch (ex) {
					console.log("some error found", ex);
					return;
				}

			};
		});
	}).then(null, console.warn);

})(amqp);