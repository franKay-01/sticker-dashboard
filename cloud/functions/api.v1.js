let util = require("../modules/util");
let helpers = require("../modules/helpers");
let _ = require('underscore');

let PacksClass = "Packs";

Parse.Cloud.define("getPacks", function (req, res) {

    let _packs = [];

    return new Parse.Query(PacksClass).equalTo("user_id", process.env.ADMIN).find({useMasterKey: true})
        .then(function (packs) {

            _packs = packs;

            let promises = _.map(packs, function (pack) {
                return pack.relation(PacksClass).query().find({useMasterKey: true});
            });

            return Parse.Promise.when(promises);

            //  return stickers.query().find({useMasterKey: true});

        }).then(function (stickerList) {

            /*
            preview:[url],
            stickers[{}]
            name:
            description
            sold:bool
            * */
            let PackList = [];
            _.map(stickerList, function (stickers) {
                if (stickers.length !== 0) {

                    _.map(stickers, sticker => {
                        console.log("sticker parent");
                        console.log(JSON.stringify(sticker.get("parent")));
                    });

                    stickerObjects.push(stickers)
                }
            });

            res.success(util.setResponseOk(stickerList));

        }, function (error) {

            util.handleError(res, error);
        });

});
