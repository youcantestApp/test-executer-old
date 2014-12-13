/**
 * Created by gbomfim on 12/10/14.
 */
var WebDriverService = require('./webdriverService');
var chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

var q = require('q');


var webdriver;
var initialize = (function () {
var initialized = false;
return function() {
    if(initialized) return;

    webdriver = new WebDriverService().getInstance();
    webdriver.init();
    initialized = true;
}
})();

function executeTestSequence(object) {
    initialize();

    var finishTestExecutionDefer = q.defer();

    var sequencePromises = [];

    var errors = [],
        dones = [];

    var initialFn = function () {
        return webdriver.openUrl(object.context.url);
    };
    sequencePromises.push(initialFn);

    object.actions.forEach(function(action) {
        var fn = (function () {
            var _action = action;
            return function () {
                var localPromise = q.defer();
                webdriver[action.type](_action).then(function (res) {
                    dones.push(res);
                    localPromise.resolve(res);
                },function(reason){
                    errors.push(reason);
                });

                return localPromise.promise;
            }
        })();

        sequencePromises.push(fn);
    });

    object.asserts.forEach(function (assert) {
        var fn = (function () {
            var _assert = assert;
            return function() {
                var localPromise = q.defer();
                webdriver[assert.type](_assert).then(function (res) {
                    dones.push(res);
                    localPromise.resolve(res);
                },function(reason){
                    errors.push(reason);
                });

                return localPromise.promise;
            }
        })();

        sequencePromises.push(fn);
    });


    var last = function() {
        return webdriver.done().then(function (res) {
            console.log("ultima");
            finishTestExecutionDefer.resolve({ dones: dones, errors: errors });
        },function(reason){
            console.log(reason);
        });
    };

    sequencePromises.push(last);

    var initialDefer = q.defer();

    var promise = (function () {
        console.log("initial");
        return initialDefer.promise;
    })();

    var result = q();
    sequencePromises.forEach(function(fn) {
        result = result.then(function () {
            fn();
        });
    });

    console.log("chained...will start in 1 seconds");

    promise.then(result);

    setTimeout(function () {
        initialDefer.resolve();
    }, 1000);

    return finishTestExecutionDefer.promise;
};


module.exports.build = executeTestSequence;