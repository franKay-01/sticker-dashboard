let util = require("../modules/util");
let helpers = require("../modules/helpers");
let _ = require('underscore');

let PacksClass = "Packs";

Parse.Cloud.define("getStickers", function (req, res) {

    res.success(util.setResponseOk(process.env.ADMIN));

   /* // var user = req.user;
    return new Parse.Query(PacksClass).equalTo("objectId", "EksXNOeVKj").first({useMasterKey: true})
        .then(function (pack) {

            let stickers = pack.relation(PacksClass);
            return stickers.query().find({useMasterKey: true});

        }).then(function (stickers) {

            res.success(util.setResponseOk(stickers));

        }, function (error) {

            util.handleError(res, error);
        });*/

});

Parse.Cloud.define("getSticker", function (req, res) {

    let stickerId = req.params.stickerId;
    // var user = req.user;

    stickers.findById(stickerId).then(function (badge) {

        res.success(util.setResponseOk(badge));

    }, function (error) {

        util.handleError(res, error);

    });

});