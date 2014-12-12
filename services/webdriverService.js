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

    function getClient () {
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
        getClient().url(url,function(err, res) {
            if(res && res.state == "success")
                defer.resolve(res.state);
            else
                defer.reject(error.message);
        });

        return defer.promise;
    };

    WebDriveService.prototype.click = function (action) {
        console.log("start click");

        var defer = q.defer();

        getClient().click(action.selector,
            (function (deferr) {
                var _defer = deferr;
                return function(err, source) {
                    console.log("clicked");
                    if (err)
                        _defer.reject("error onclick");
                    else
                        _defer.resolve("clicked");

                }
            })(defer)
        );

        return defer.promise;
    };

    WebDriveService.prototype.setValue = function (action) {
        console.log("start setvalue");

        var defer = q.defer();

        getClient().addValue(action.selector,action.value,
            (function (deferr) {
                var _defer = deferr;
                return function (err, source) {
                    console.log("add value");
                    if (err)
                        _defer.reject("error add valued");
                    else
                        _defer.resolve("value added");
                };
            })(defer)
        );

        return defer.promise;
    };

    WebDriveService.prototype.hasClass = function (assert) {
        console.log("start hasclass");

        var defer = q.defer();

        getClient().getAttribute(assert.selector,'class',
            (function (deferr) {
                var _defer = deferr;
                return function(err, attr) {
                    console.log("hasClass");
                    if (err)
                        _defer.reject("error");
                    else if (!attr)
                        _defer.reject("has no class");
                    else {
                        var found = false;
                        attr.split(" ").forEach(function (className) {
                            if (className == assert.value) {
                                found = true;
                                return false;
                            }
                        });

                        if (found)
                            _defer.resolve("class found");
                        else
                            _defer.reject("class not found");
                    }
                }
            })(defer)
        );


        return defer.promise;
    };

    WebDriveService.prototype.assertValue = function (assert) {
        console.log("start assertvalue");

        var defer = q.defer();

        getClient().getValue(assert.selector,
            (function (deferr) {
                var _defer = deferr;

                return function (err, value) {
                    console.log("hasText");
                    if (err)
                        _defer.reject("error");
                    else {
                        if (value == assert.value)
                            _defer.resolve("value found");
                        else
                            _defer.reject("value not found");
                    }
                }
            })(defer)
        );

        return defer.promise;
    };

    WebDriveService.prototype.done = function () {
        console.log("done start");

        var defer = q.defer();

        var doneFn = function () {
            defer.resolve('finished');
        };

        getClient().call(doneFn);

        return defer.promise;
    };

    return WebDriveService;
})();

module.exports = WebDriveService;
