/**
 * Created by gbomfim on 12/11/14.
 */
var webdriverio = require('webdriverio');

var q = require('q');


var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

var WebDriveService = (function () {
    var singletonService;
    var clientInstance;

    function WebDriveService() {
        clientInstance = webdriverio.remote(options);
    };

    function getClient() {
        return clientInstance;
    };

    WebDriveService.prototype.getInstance = function () {
        if (!singletonService)
            singletonService = new WebDriveService();

        return this;
    };

    WebDriveService.prototype.dispose = function () {
        if (getClient())
            this.getClient().end();

        return this;
    };

    WebDriveService.prototype.init = function () {
        getClient().init();

        return this;
    };

    WebDriveService.prototype.openUrl = function (url) {
        var defer = q.defer();
        getClient().url(url, function (err, res) {
            if (res && res.state == "success")
                defer.resolve(res.state);
            else
                defer.reject(err);
        });

        return defer.promise;
    };

    WebDriveService.prototype.click = function (action) {
        var defer = q.defer();

        getClient().click(action.selector, function (err, source) {
            console.log("clicked");
            if (err)
                defer.reject("error onclick");
            else
                defer.resolve("clicked");

        });

        return defer.promise;
    };

    WebDriveService.prototype.setValue = function (action) {
        var defer = q.defer();

        getClient().addValue(action.selector, action.value, function (err, source) {
            console.log("add value");
            if (err)
                defer.reject("error add valued");
            else
                defer.resolve("value added");
        });

        return defer.promise;
    };

    WebDriveService.prototype.hasClass = function (assert) {
        var defer = q.defer();

        getClient().getAttribute(assert.selector, 'class', function (err, attr) {
            console.log("hasClass");
            if (err)
                defer.reject("error");
            else if (!attr)
                defer.reject("has no class");
            else {
                var found = false;
                attr.split(" ").forEach(function (className) {
                    if (className == assert.value) {
                        found = true;
                        return false;
                    }
                });

                if (found)
                    defer.resolve("class found");
                else
                    defer.reject("class not found");
            }
        });

        return defer.promise;
    };

    WebDriveService.prototype.assertValue = function (assert) {
        var defer = q.defer();

        getClient().getValue(assert.selector, function (err, value) {
            console.log("hasText");
            if (err)
                defer.reject("error");
            else {
                if (value == assert.value)
                    defer.resolve("value found");
                else
                    defer.reject("value not found");
            }
        });

        return defer.promise;
    };

    WebDriveService.prototype.redirectToUrl = function (assert) {
        var defer = q.defer();

        //pauseState(5000).then(function() {
            getClient().url(function (err, expected) {
                console.log("got url");
                if (err) defer.reject("error");

                else {
                    if (expected.value.split('?')[0] == assert.value)
                        defer.resolve("url is ok");
                    else
                        defer.reject("url wasnt as expected");
                }
            });
       // });

        return defer.promise;
    };

    function pauseState(amountOfTime) {
        var defer = q.defer();

        getClient().pause(amountOfTime).then(function() {
            defer.resolve('paused for' + amountOfTime);

        }, function () {
            defer.reject('fail on pause');
        });

        return defer.promise;
    }


    WebDriveService.prototype.done = function () {
        var defer = q.defer();

        var doneFn = function () {
            console.log("done");
            return defer.resolve('finished');
        };

        getClient().call(doneFn);

        return defer.promise;
    };

    WebDriveService.prototype.end = function () {
        var defer = q.defer();

        getClient().end(function () {
            console.log("closed");
            defer.resolve('closed');
        });

        return defer.promise;
    };

    return WebDriveService;
})();

module.exports = WebDriveService;
