var testResultRepository = require('../repositories/testResultRepository');


function persistResults(scheduleId, dones, fails) {

	var resultObject = {};

	resultObject.scheduleId = scheduleId;

	resultObject.passed = dones;
	resultObject.fails = fails;

	return testResultRepository.saveOne(resultObject);
}


module.exports.saveResults = persistResults;
