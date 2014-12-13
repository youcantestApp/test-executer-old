#!/usr/bin/env node
// Process tasks from the work queue
var amqp = require('amqplib');

var assertBuilder = require('./services/assertBuilderService');
var fs = require('fs');
var q = require('q');
//CONFIGS

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

                var body = message.content.toString();

                try {
                    fs.readFile('./dummy_data/first_object_attempt.json', 'utf8', function (err, data) {
                        var object = JSON.parse(data);
                        var defer = assertBuilder.executeTestSequence(object);

                        defer.then(function (obj) {
                            console.log(obj.dones, obj.errors);
                            channel.ack(message);

                            console.log("[x] Done");
                        }).then(function () {
                            "use strict";
                            assertBuilder.finishTestSequence();
                        });
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