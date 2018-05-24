let util = require("../modules/util");
let helpers = require("../modules/helpers");
let _ = require('underscore');

let PacksClass = "Packs";

Parse.Cloud.define("getPacks", function (req, res) {

    return new Parse.Query(PacksClass).equalTo("user_id", process.env.ADMIN).find({useMasterKey: true})
        .then(function (packs) {

            let promises = _.map(packs, function (pack) {
                return pack.relation(PacksClass).query().find({useMasterKey: true});
            });

            return Parse.Promise.when(promises);

            //  return stickers.query().find({useMasterKey: true});

        }).then(function (stickers) {

            res.success(util.setResponseOk(stickers));

        }, function (error) {

            util.handleError(res, error);
        });

});
