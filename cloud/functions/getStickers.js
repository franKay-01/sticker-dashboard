var util = require("../modules/util");
var helpers = require("../modules/helpers");
var _ = require('underscore');
var stickers = require("../modules/stickers");

Parse.Cloud.define("getStickers", function (req, res) {

    var user = req.user;
    var token = user.getSessionToken();

    stickers.getAll(token).then(function(badges){

        res.success(util.setResponseOk(badges));

    },function(error){

        util.handleError(res, error);

    });

});

Parse.Cloud.define("getSticker", function (req, res) {

    var stickerId = req.params.stickerId;
    var user = req.user;
    var token = user.getSessionToken();

    stickers.findById(stickerId,token).then(function (badge) {

        res.success(util.setResponseOk(badge));

    }, function (error) {

        util.handleError(res, error);

    });

});