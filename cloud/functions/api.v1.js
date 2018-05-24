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

            //todo check if pack is published
            //todo check if pack has not been archived
            _.map(_packs, pack => {

                let packItem = {};
                packItem.name = pack.get("pack_name");
                packItem.description = pack.get("pack_description");
                packItem.description = pack.get("art_work");

                _.map(stickerList, function (stickers) {

                    if (stickers.length !== 0) {
                        //todo choose five stickers for preview

                        if (pack.id === stickers.get("parent").id)
                            packItem.stickers = [];
                        packItem.stickers = stickers;
                        stickerObjects.push(packItem)
                    }
                });
            });


            res.success(util.setResponseOk(stickerObjects));

        }, function (error) {

            util.handleError(res, error);
        });

});
