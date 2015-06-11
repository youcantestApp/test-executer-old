/**
 * Created by gbomfim on 12/10/14.
 */
var WebDriverService = require('./webdriverService');
var q = require('q');

var webdriver;

function executeTestSequence(object) {
	webdriver = WebDriverService.getInstance();

	var finishTestExecutionDefer = q.defer();

	var sequencePromises = [];

	var assertResults = [],
		actionResults = [];

	var initialFn = function () {
		console.log("primeiro passo");
		return webdriver.openUrl(object.context.url);
	};

	sequencePromises.push(initialFn);

	if(object.actions !== undefined && object.actions.length) {
		object.actions.forEach(function (action) {
			var fn = (function () {
				var _action = action;
				return function () {
					var localPromise = q.defer();
					webdriver[action.type](_action).then(function (res) {
						var data = {
							action: action,
							success: true,
							result: res
						};

						actionResults.push(data);

						localPromise.resolve(res);
					}, function (reason) {
						var data = {
							action: action,
							success: false,
							reason: reason
						};

						actionResults.push(data);

						localPromise.resolve(reason);
					});

					return localPromise.promise;
				}
			})();

			sequencePromises.push(fn);
		});
	}

	object.asserts.forEach(function (assert) {
		var fn = (function () {
			var _assert = assert;
			return function () {
				var localPromise = q.defer();
				webdriver[assert.type](_assert).then(function (res) {
					var data = {
						assert: assert,
						success: true,
						result: res
					};

					assertResults.push(data);

					localPromise.resolve(res);
				}, function (reason) {
					var data = {
						assert: assert,
						success: false,
						reason: reason
					};

					assertResults.push(data);

					localPromise.resolve(reason);
				});

				return localPromise.promise;
			}
		})();

		sequencePromises.push(fn);
	});


	var last = function () {
		return webdriver.done().then(function (res) {
			console.log("ultimo passo");
			finishTestExecutionDefer.resolve({actionResults: actionResults, assertResults: assertResults});
		}, function (reason) {
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

	sequencePromises.forEach(function (fn) {
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

function finishTestSequence() {
console.log("VOU FEHCAR NO ASSERBUILDER");
	return webdriver.end()
}


module.exports.executeTestSequence = executeTestSequence;
module.exports.finishTestSequence = finishTestSequence;
