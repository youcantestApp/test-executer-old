/**
 * Created by gbomfim on 12/11/14.
 */
var webdriverio = require('webdriverio');

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

    return WebDriveService;
})();

module.exports = WebDriveService;
