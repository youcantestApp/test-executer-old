/**
 * Created by gbomfim on 12/11/14.
 */
var webdriverio = require('webdriverio');

var q = require('q');


var options = {
	desiredCapabilities: {
		browserName: 'phantomjs'
	},
	waitForTimeout: 500,
	logLevel: 'verbose',
	logColor: true,
	port:4444
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
		singletonService = new WebDriveService();

		return this;
	};

	WebDriveService.prototype.dispose = function () {
		getClient().end();

		return this;
	};

	WebDriveService.prototype.init = function () {
		getClient().init();

		getClient().windowHandleSize({width: 1024, height: 768});
		return this;
	};

	WebDriveService.prototype.openUrl = function (url) {
		var defer = q.defer();
		getClient().url(url, function (err, res) {
			if (res)
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

	WebDriveService.prototype.isElementVisible = function (assert) {
		var defer = q.defer();

		getClient().isVisible(assert.selector, function (err, visible) {
			console.log("checked if element is visible");
			if (err) defer.reject("error");

			else {
				if (visible)
					defer.resolve("element is visible in page");
				else
					defer.reject("element isnt visible in page");
			}
		});

		return defer.promise;
	};

	WebDriveService.prototype.isElementExists = function (assert) {
		var defer = q.defer();

		getClient().isExisting(assert.selector, function (err, existing) {
			console.log("checked if element existing");
			if (err) defer.reject("error");

			else {
				if (existing)
					defer.resolve("element exists in page");
				else
					defer.reject("element not exists in page");
			}
		});

		return defer.promise;
	};

	WebDriveService.prototype.checkUrl = function (assert) {
		var defer = q.defer();

		getClient().url(function (err, expected) {
			console.log("got url");
			if (err) defer.reject("error");

			else {
				if (expected.value.indexOf(assert.value) > -1)
					defer.resolve("url is ok");
				else
					defer.reject("url isnt as expected");
			}
		});

		return defer.promise;
	};

	function pauseState(amountOfTime) {
		var defer = q.defer();

		getClient().pause(amountOfTime).then(function () {
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

		console.log("VOU FECHAR NO WD");

		getClient().deleteCookie().sessions(function(err, sessions) {
			console.log("sessions before");
			console.log(2, sessions);
		    });


		getClient().deleteCookie().end(function () {
			console.log("closed");
			defer.resolve('closed');
		}).sessions(function(err, sessions) {
			console.log("sessions after");
			console.log(2, sessions);
		    });

		return defer.promise;
	};

	return WebDriveService;
})();

module.exports = WebDriveService;
