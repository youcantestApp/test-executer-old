var base = require("./baseRepository"), q = require('q');

var ObjectID = require("mongodb").ObjectID;

var collectionName = 'schedules';

var getById = function getById(id) {
	var defer = q.defer();

	base.connect().then(function (db) {
		var collection = db.collection(collectionName);

		collection.find({_id: ObjectID.createFromHexString(id)}).toArray(function (err, docs) {
			if (err != null || !docs.length) {
				return defer.reject("unable to find -> error:" + err.message);
			}

			base.close();


			defer.resolve(docs[0]);
		});
	});

	return defer.promise;
};

function saveOne(object) {
	var defer = q.defer();

	base.connect().then(function (db) {
		var collection = db.collection(collectionName);

		if(object._id) {
			collection.save({ _id: object._id }, object, function (err, record) {
				if (err || !record.length)
					return defer.reject(err);

				defer.resolve(record[0]._id.tostring());
			});
		}
		else {
			collection.insert(object, function (err, record) {
				if (err || !record.length)
					return defer.reject(err);

				defer.resolve(record[0]._id.tostring());
			});
		}
	});

	return defer.promise;
}


module.exports.getById = getById;
module.exports.saveOne = saveOne;
