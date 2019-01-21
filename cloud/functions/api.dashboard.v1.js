let util = require("../modules/util");
let helper = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');
let create = require("../modules/create");
let _class = require("../modules/classNames");
let analytics = require("../modules/analytics");
let query = require("../modules/query");

Parse.Cloud.define("getHomeStickers", function (req, res) {

    new Parse.Query(_class.Packs).equalTo("objectId", process.env.DEFAULT_PACK).first().then(function (pack) {

        if (pack) {

            let col = pack.relation(_class.Packs);
            return col.query().limit(40).find();

        } else {
            return []
        }

    }).then(function (stickers) {

        if (stickers.length) {

            stickers = helper.shuffle(stickers);
            stickers = stickers.slice(0, 3);
            let _sticker = [];
            stickers.forEach(sticker => {
                _sticker.push(create.Sticker(sticker))
            });

            res.success(util.setResponseOk(_sticker));


        }

    },function (error) {

        util.handleError(res, error);
    })


});
