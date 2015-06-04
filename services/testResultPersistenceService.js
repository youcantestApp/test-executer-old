var _ = require('lodash');

var testResultRepository = require('../repositories/testResultRepository');



function persistResults(scheduleId, testResult, user) {

	var resultObject = {};

	resultObject.user = user;
	resultObject.scheduleId = scheduleId;
	resultObject.testName = testResult.testName;

	resultObject.actions = testResult.actionResults;
	var successActions  = _.filter(testResult.actionResults, function (element) {
		return element.success;
	});

	resultObject.asserts = testResult.assertResults;
	var successAsserts = _.filter(testResult.assertResults, function (element) {
		return element.success;
	});

	resultObject.testSucceed = (testResult.actionResults.length === successActions.length && testResult.assertResults.length === successAsserts.length);

	return testResultRepository.saveOne(resultObject);
}


module.exports.saveResults = persistResults;
