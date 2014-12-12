#!/usr/bin/env node
// Process tasks from the work queue
var amqp = require('amqplib');

var assertBuilder = require('./services/assertBuilderService');
var fs = require('fs');
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

                var seconds = body.split('.').length - 1;

                try {
                    fs.readFile('./dummy_data/first_object_attempt.json', 'utf8', function (err, data) {
                        var object = JSON.parse(data);
                        assertBuilder.build(object);
                    });
                }
                catch(ex) {
                    console.log("some error found", ex);
                    return;
                }

                setTimeout(function () {
                    console.log("[x] Done");
                    channel.ack(message);
                }, seconds * 1000);
            };
        });
    }).then(null, console.warn);

})(amqp);