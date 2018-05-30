let util = require("../modules/util");
let helpers = require("../modules/helpers");
let _ = require('underscore');

let PacksClass = "Packs";
let StoriesClass = "Stories";
let StoryItem = "StoryItem";
let ArtWorkClass = "ArtWork";
let StickersClass = "Stickers";

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

    let _stories = [];
    let stickerIds = [];
    let _artworks = [];
    let stickerObjects = [];

    return Parse.Promise.when(
        new Parse.Query(StoriesClass).find("user_id", process.env.ADMIN).find({useMasterKey: true}),
        new Parse.Query(ArtWorkClass).find()
    ).then((stories, artworks) => {

        _stories = stories;
        _artworks = artworks;

        _.each(artworks, artwork => {

            //TODO update sticker to stickerId
            stickerIds.push(artwork.get("sticker"));

        });

        return new Parse.Query(StickersClass).containedIn("objectId", stickerIds).find();

    }).then(stickers => {

        // parseData.id = response.data.story.id;
        // parseData.title = response.data.story.get("title");
        // parseData.color = response.data.story.get("color");
        // parseData.summary = response.data.story.get("summary");
        // parseData.name = response.data.sticker.get("stickerName");
        // parseData.url = response.data.sticker.get("uri").url();
        // let stories  = [];
        // response.data.stories.map(story => {
        //     stories.push({id:story.id,type:story.get("type"),content:story.get("content")})
        // });

        _.each(_stories, function (story) {

            let _story = {};
            _story.id = story.id;
            _story.title = story.get("title");
            _story.color = story.get("color");

            _.each(_artworks, function (artwork) {

                _.each(stickers, function (sticker) {

                    if (artwork.get("sticker") === sticker.id) {

                        _story.stickerName = sticker.get("stickerName");
                        _story.stickerUrl = sticker.get("uri").url();
                    }
                })
            });

            stickerObjects.push(_story);

        });

        res.success(util.setResponseOk(stickerObjects));

    }, error => {

        util.handleError(res, error);

    });

});

















