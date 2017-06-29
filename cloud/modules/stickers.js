var helpers = require("./helpers");
var util = require("./util");
var _ = require("underscore");
var Stickers = "Sticker";

getQuery = function (key, value) {
    var query = new Parse.Query(Stickers);
    query.equalTo(key, value);
    query.toJSON();
    return query;
};

getAll = function () {
    return new Parse.Query(Stickers)
        .find({useMasterKey: true});
};

/**
 * Find a sticker by id
 * @param stickerId
 * @param token
 * @returns {root.Parse.Promise}
 */
findById = function (stickerId,token) {

    var promise = new Parse.Promise();

    getQuery("objectId", stickerId)
        .first({useMasterKey: true})
        .then(function (sticker) {

            if(sticker){
                promise.resolve(sticker)
            }

            return sticker;

        }, function (error) {
            promise.reject(error);
        });

    return promise;
};


exports.findById = findById;
exports.getQuery = getQuery;
exports.getAll = getAll;

