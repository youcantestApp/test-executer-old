var base = require("./baseRepository"), q = require('q');
var ObjectID = require("mongodb").ObjectID;

var collectionName = 'suite';

var getById = function getById(id) {
    var defer = q.defer();

    base.connect().then(function(db) {
        var collection = db.collection(collectionName);

        collection.find({ _id: ObjectID.createFromHexString(id) }).toArray(function (err, docs) {
            if(err != null) {
                return defer.reject("unable to find -> error:" + err.message);
            }

            base.close();

            defer.resolve(docs);
        });
    });

    return defer.promise;
}

module.exports.getById = getById;
