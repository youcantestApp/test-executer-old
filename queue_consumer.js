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

var errorQueueConfiguration = {
	name: "youcantest.test_queue_error",
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
				console.log("dammn!");
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

//function publishToErrorQueue(scheduleId, errorMessage) {
//
//
//	var bodyStr = message.content.toString();
//
//	var ok = conn.createChannel();
//	ok = ok.then(function(ch) {
//		var queue = ch.assertQueue(errorQueueConfiguration.name, errorQueueConfiguration.options);
//		ch.sendToQueue(errorQueueConfiguration.name, new Buffer(bodyStr));
//	});
//	return ok;
//}

function getConnection() {
	//return amqp.connect('amqp://guest:guest@rabbit');
	return amqp.connect('amqp://admin:admin@rabbit');
}

function getQueue(channel, configuration) {
	var queue = channel.assertQueue(configuration.name, configuration.options);

	return queue.then(function () {
		channel.prefetch(PREFETCH_NUMBER);
	});
}

function queueHandler(scheduleId) {
	scheduleRepository.getById(scheduleId).then(function (data) {
		if (data.length == 0 || !data.testId) {
			throw "error to get schedule";
		}

		var user = data.user;

		execute(data.testId).then(function (testResult) {
			var finishExecutionDate = new Date();
			resultPersistenceService.saveResults(scheduleId, data.testId, testResult, finishExecutionDate, user).then(function (id) {
				data.resultId = id;
				data.executionDate = finishExecutionDate;
				scheduleRepository.saveOne(data);
			});

			console.log("scheduleId : " + scheduleId + "  done");
		}, function (err) {
			throw "error to execute test";
		});
	}, function () {
		throw "error to get test";
	});
};


(function () {
	getConnection().then(function (conn) {
		process.once('SIGINT', function () {
			conn.close();
		});

		return conn.createChannel().then(function (channel) {
			getQueue(channel, queueConfiguration).then(function () {
				console.log(" [*] Waiting for messages. To exit press CTRL+C");

				channel.consume(queueConfiguration.name, function(message) {
					console.log(" [x] message received");

					var bodyStr = message.content.toString();
					var messageContent = JSON.parse(bodyStr);

					if (!messageContent || !messageContent.scheduleId) {
						console.log('error on parse message');
						return;
					}

					try {
						queueHandler(messageContent.scheduleId);
					}
					catch(error) {
						console.log('error on handle message');
						return;
					}
				},{ noAck: true });
			});
		});
	}).then(null, console.warn);
})();
