var util = require("../modules/util");
var helpers = require("../modules/helpers");
var _ = require('underscore');
var stickers = require("../modules/stickers");

Parse.Cloud.define("getStickers", function (req, res) {

    // var user = req.user;

    stickers.getAll().then(function (stickers) {

        var sticker_relation = stickers.relation("Categories");
        return sticker_relation.query().find();

    }).then(function (stickerCategories) {

        var categoryNames = [];
        if (stickerCategories.length) {
            _.each(stickerCategories, function (category) {
                categoryNames.push(category.get("name"))
            });
        }

        res.success(util.setResponseOk(stickers));


    }, function (error) {

        util.handleError(res, error);

    });

});

Parse.Cloud.define("getSticker", function (req, res) {

    var stickerId = req.params.stickerId;
    // var user = req.user;

    stickers.findById(stickerId).then(function (badge) {

        res.success(util.setResponseOk(badge));

    }, function (error) {

        util.handleError(res, error);

    });

});