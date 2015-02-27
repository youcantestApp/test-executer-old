
var testResultRepository = require('../repositories/testResultRepository');


function persistResults(suiteId, testId, dones, fails) {
    var executionDate = new Date();

    var resultObject = {};

    resultObject.suiteId = 1;

    resultObject.executionDate = executionDate;

    resultObject.testId = testId;

    resultObject.passed = dones;
    resultObject.fails = fails;

    return testResultRepository.saveOne(resultObject);
}


module.exports.saveResults = persistResults;
