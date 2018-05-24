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
            let stickerObjects = [];
            _.map(stickerList, function (stickers) {
                if (stickers.length !== 0) {

                    _.map(_packs, pack => {
                        console.log("pack id");
                        console.log(pack.id);
                    });

                    _.map(stickers, sticker => {
                        console.log("sticker parent id");
                        console.log(sticker.get("parent").id);
                    });

                    stickerObjects.push(stickers)
                }
            });

            res.success(util.setResponseOk(stickerObjects));

        }, function (error) {

            util.handleError(res, error);
        });

});
