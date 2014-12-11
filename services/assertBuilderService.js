/**
 * Created by gbomfim on 12/10/14.
 */
var WebDriverService = require('./webdriverService');

module.exports.test = function build(object) {
    var test = new WebDriverService();
    test.init();
    console.log(test);
}