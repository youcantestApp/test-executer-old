/**
 * Created by guilherme on 12/22/14.
 */
var base = require("./baseRepository"), q = require('q');
var ObjectID = require("mongodb").ObjectID;

var collectionName = 'test';

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

var getAllByIds = function getAllBySuite(listOfIds) {
    var defer = q.defer();

    base.connect().then(function(db) {
        var collection = db.collection(collectionName);

        var listOfObjIds = [];
        listOfIds.forEach(function (element) {
            listOfObjIds.push(ObjectID.createFromHexString(element));
        });

        collection.find({ _id: { '$in': listOfObjIds } }).toArray(function (err, docs) {
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
module.exports.getAllByIds = getAllByIds;
