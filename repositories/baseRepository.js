var MongoClient = require('mongodb').MongoClient,
	q = require('q');

var databaseName = 'youcantest_db';

// Connection URL
var url = 'mongodb://localhost:27017/' + databaseName;

var dbInstance;
// Use connect method to connect to the Server
var connect = function () {
	var defer = q.defer();

	MongoClient.connect(url, function (err, db) {
		if (err != null) {
			return defer.reject("unable to connect -> error:" + err.message);
		}

		dbInstance = db;

		defer.resolve(db);
	});

	return defer.promise;
}

var closeConnection = function () {
	dbInstance.close();
}

module.exports.connect = connect;
module.exports.close = closeConnection;
