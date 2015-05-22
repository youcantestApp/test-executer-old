var _ = require('lodash');

var testResultRepository = require('../repositories/testResultRepository');



function persistResults(scheduleId, actions, asserts) {

	var resultObject = {};

	resultObject.scheduleId = scheduleId;

	resultObject.actions = actions;
	var successActions  = _.filter(actions, function (element) {
		return element.success;
	});

	resultObject.asserts = asserts;
	var successAsserts = _.filter(asserts, function (element) {
		return element.success;
	});

	resultObject.testSucceed = (actions.length === successActions.length && asserts.length === successAsserts.length);

	return testResultRepository.saveOne(resultObject);
}


module.exports.saveResults = persistResults;
