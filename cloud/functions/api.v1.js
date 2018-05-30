let util = require("../modules/util");
let helpers = require("../modules/helpers");
let _ = require('underscore');

let PacksClass = "Packs";
//let PacksClass = "Packs";

Parse.Cloud.define("getPacks", function (req, res) {

    let _packs = [];

    return new Parse.Query(PacksClass).equalTo("user_id", process.env.ADMIN).find({useMasterKey: true})
        .then(function (packs) {

            _packs = packs;
            let promises = [];
            _.map(packs, function (pack) {
                promises.push(pack.relation(PacksClass).query().find({useMasterKey: true}));
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


                let _artwork = pack.get("art_work");
                if (_artwork) {
                    packItem.artwork = _artwork.url();
                } else {
                    packItem.artwork = "";
                }

                _.map(stickerList, function (stickers) {

                    if (stickers.length) {

                        //todo choose five stickers for preview

                        let _stickers = [];
                        _.map(stickers, sticker => {

                            if (pack.id === sticker.get("parent").id) {


                                _stickers.push(sticker)
                            }

                        });

                        packItem.stickers = _stickers;

                    }
                });

                stickerObjects.push(packItem);

            });


            res.success(util.setResponseOk(stickerObjects));

        }, function (error) {

            util.handleError(res, error);
        });

});

Parse.Cloud.define("getStories", function (req, res) {

    return new Parse.Query(PacksClass).equalTo("user_id", process.env.ADMIN).find({useMasterKey: true})
        .then(packs => {



        });

});

















