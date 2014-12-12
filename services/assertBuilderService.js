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

function build(object) {
    initialize();

    var actionPromises = [];
    object.actions.forEach(function(action) {
        var fn = function () {
            return webdriver[action.type](action);
        };

        actionPromises.push(fn);
    });

    var assertPromises = [];
    object.asserts.forEach(function (assert) {
        var fn = function () {
            return webdriver[assert.type](assert);
        };

        assertPromises.push(fn);
    });

    var promise = q("blah");

    var initialFn = function () {
        console.log("first");
        return webdriver.openUrl(object.context.url);
    };

    promise.then(initialFn);

    actionPromises.forEach(function(fn) {
        promise.then(fn);
    });

    assertPromises.forEach(function(fn) {
        promise.then(fn);
    });


    var last = function() {
        var defer = q.defer();
        setTimeout(function () {
            console.log("ultima");
            defer.resolve();
        }, 1000);

        return defer.promise;
    }

    promise.then(last);

    //defer.resolve(object);
};


module.exports.build = build;