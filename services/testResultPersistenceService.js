var _ = require('lodash');

var testResultRepository = require('../repositories/testResultRepository');



function persistResults(scheduleId, actions, asserts) {

	var resultObject = {};

	resultObject.scheduleId = scheduleId;

	resultObject.actions = actions;

	resultObject.asserts = asserts;

	return testResultRepository.saveOne(resultObject);
}


module.exports.saveResults = persistResults;
