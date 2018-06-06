let util = require("../modules/util");
var helpers = require("../modules/helpers");
var _ = require('underscore');
var stickers = require("../modules/stickers");


let PacksClass = "Packs";

Parse.Cloud.define("getSticker", function (req, res) {

    let stickerId = req.params.stickerId;
    // var user = req.user;

    stickers.findById(stickerId).then(function (badge) {

        res.success(util.setResponseOk(badge));

    }, function (error) {

        util.handleError(res, error);

    });

});



