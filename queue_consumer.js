#!/usr/bin/env node
// Process tasks from the work queue
var amqp = require('amqplib');

var fs = require('fs');
var q = require('q');
//CONFIGS

var assertBuilder = require('./services/assertBuilderService');
var testRepository = require('./repositories/testRepository');
var resultPersistenceService = require('./services/testResultPersistenceService');


var PREFETCH_NUMBER = 1;

var queueConfiguration = {
    name: "test_queue",
    options: {
        durable: true
    }
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

                if(!messageContent || !messageContent.testId) {
                    throw "undefined testId";
                    return;
                }

                try {
                    //getting test from db
                    testRepository.getById(messageContent.testId).then(function(object) {
                        if(object.length == 0)
                            throw "error to get test";

                        var defer = assertBuilder.executeTestSequence(object);

                        defer.then(function (obj) {
                            console.log(obj.dones, obj.errors);

                            console.log("terminei todos os testes");

                            resultPersistenceService.saveResults(messageContent.suiteId, messageContent.testId, obj.dones, obj.errors);

                            channel.ack(message);

                            console.log("[x] Done");
                        },function() { console.log("fuck!"); }).then(function () {
                            assertBuilder.finishTestSequence();
                        });

                    }, function () {
                        throw "error to get test";
                    });
                }
                catch(ex) {
                    console.log("some error found", ex);
                    return;
                }

            };
        });
    }).then(null, console.warn);

})(amqp);