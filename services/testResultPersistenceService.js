var _ = requide('lodash');

var testResultRepository = require('../repositories/testResultRepository');



function persistResults(scheduleId, dones, fails) {

	var resultObject = {};

	resultObject.scheduleId = scheduleId;

	resultObject.passed = _.map(dones, function(element) {
		return {message : element};
	});

	resultObject.fails = _.map(fails, function(element) {
		return {message : element};
	});

	return testResultRepository.saveOne(resultObject);
}


module.exports.saveResults = persistResults;
