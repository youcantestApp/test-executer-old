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
		try {
			var defer = assertBuilder.executeTestSequence(object);

			return defer.then(function (obj) {
				console.log(obj.actionResults, obj.assertResults);

				console.log("terminei todos os testes");
				console.log("[x] Done");

				obj.testName = object.name;

				return obj;
			}, function (err) {
				console.log("fuck!");
				throw err;
			}).then(function (obj) {
				assertBuilder.finishTestSequence();
				return obj;
			});
		}
		catch (error) {
			console.log('error on executeTestSequence', error);

			throw error;
		}
	}, function (err) {
		console.log('error on testrepository get');
	});
};

function publishToErrorQueue(conn, message) {
	var errorQueueConfiguration = {
		name: "youcantest.test_queue_error",
		options: {
			durable: false
		}
	};

	var bodyStr = message.content.toString();

	var ok = conn.createChannel();
	ok = ok.then(function(ch) {
		var queue = ch.assertQueue(errorQueueConfiguration.name, errorQueueConfiguration.options);
		ch.sendToQueue(errorQueueConfiguration.name, new Buffer(bodyStr));
	});
	return ok;
}


(function (queueContext) {
	//queueContext.connect('amqp://guest:guest@rabbit').then(function (conn) {
	queueContext.connect('amqp://admin:admin@rabbit').then(function (conn) {

		process.once('SIGINT', function () {
			conn.close();
		});

		return conn.createChannel().then(function (channel) {
			var queue = channel.assertQueue(queueConfiguration.name, queueConfiguration.options);

			queue = queue.then(function () {
				channel.prefetch(PREFETCH_NUMBER);
			});
			queue = queue.then(function () {
				try {
					channel.consume(queueConfiguration.name, doWorkFn, {
							noAck: false
						}
					);
				}
				catch(message) {
					console.log('[-] Error on process message...');

					channel.ack(message);
					if(typeof message === 'object') {
						publishToErrorQueue(conn, message);
						console.log('[-] published to error queue.');
					}
				}

				console.log(" [*] Waiting for messages. To exit press CTRL+C");
			});

			return queue;

			function doWorkFn(message) {
				console.log(" [x] message received");

				var bodyStr = message.content.toString();

				var messageContent = JSON.parse(bodyStr);

				if (!messageContent || !messageContent.scheduleId) {
					throw message;
					return;
				}

				try {
					//getting test from db
					scheduleRepository.getById(messageContent.scheduleId).then(function (data) {
						if (data.length == 0 || !data.testId)
							throw "error to get schedule";

						var user = data.user;

						execute(data.testId).then(function (testResult) {

							resultPersistenceService.saveResults(messageContent.scheduleId, testResult, user).then(function (id) {
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
					throw message;
					return;
				}

			};
		});
	}).then(null, console.warn);

})(amqp);
