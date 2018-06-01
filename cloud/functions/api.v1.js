let util = require("../modules/util");
let helpers = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');

let PacksClass = "Packs";
let StoriesClass = "Stories";
let StoryItemClass = "StoryItem";
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

            //TODO properly handle error
            res.success(util.setResponseOk(stickerObjects));

        }, function (error) {

            util.handleError(res, error);
        });

});

Parse.Cloud.define("getPack", function (req, res) {

    let packId = req.params.packId;

});

Parse.Cloud.define("getStory", function (req, res) {

    let _story = {};
    let _storyItems = [];

    let storyId = req.params.storyId;

    Parse.Promise.when(
        new Parse.Query(StoriesClass).equalTo("objectId", storyId).first({useMasterKey: true}),
        new Parse.Query(ArtWorkClass).equalTo("object_id", storyId).first({useMasterKey: true}),
        new Parse.Query(StoryItemClass).equalTo("story_id", storyId).find({useMasterKey: true})
    ).then(function (story, sticker, storyItems) {

        _story = story;
        _storyItems = storyItems;

        console.log("STORY QUERY " + JSON.stringify(story));

        return new Parse.Query(StickersClass).equalTo("objectId", sticker.get("sticker")).first({useMasterKey: true});

    }).then(function (sticker) {

        console.log("STICKER QUERY ");

        if (_story && sticker && _storyItems) {

            /*  _story.id = story.id;
              _story.title = story.get("title");
              _story.summary = story.get("summary");*/
            let story = {};
            story.id = _story.id;
            story.title = _story.get("title");
            story.summary = _story.get("summary");
            story.stickerName = sticker.get("stickerName");

            if (sticker.get("uri")) {
                story.stickerUrl = sticker.get("uri").url();
            } else {
                story.stickerUrl = "";
            }

            let colors = _story.get("color");
            if (colors) {
                story.colors = colors
            } else {
                story.colors = type.DEFAULT.color
            }

            story.stories = [];

            if (_storyItems.length) {
                let storyItem = [];
                _.each(_storyItems, storyItem => {
                 //   storyItem.push({content: storyItem.get("content"), type: storyItem.get("type")})
                    console.log("content " + storyItem.get("content"))
                });
                story.stories = storyItem;
            }

            console.log("STORY DATA " + JSON.stringify(_storyItems));

            res.success(util.setResponseOk(story));

        } else {

            util.handleError(res, util.setErrorType(util.STORY_PREVIEW_ERROR));

        }

    }, function (error) {

        console.log("STORY ERROR " + JSON.stringify(error));

        util.handleError(res, error);

    })

});


Parse.Cloud.define("getStories", function (req, res) {

    let _stories = [];
    let stickerIds = [];
    let _artworks = [];
    let stickerObjects = [];

    return Parse.Promise.when(
        new Parse.Query(StoriesClass).equalTo("user_id", process.env.ADMIN).find({useMasterKey: true}),
        new Parse.Query(ArtWorkClass).find()
    ).then((stories, artworks) => {

        _stories = stories;
        _artworks = artworks;

        _.each(artworks, artwork => {

            //TODO add type:Number=[short story, comic etc] to story
            //TODO update sticker to stickerId
            stickerIds.push(artwork.get("sticker"));

        });

        return new Parse.Query(StickersClass).containedIn("objectId", stickerIds).find({useMasterKey: true});

    }).then(stickers => {

        _.each(_stories, function (story) {

            let _story = {};
            _story.id = story.id;
            _story.title = story.get("title");
            _story.summary = story.get("summary");

            let colors = story.get("color");
            if (colors) {
                _story.colors = colors
            } else {
                _story.colors = type.DEFAULT.color
            }

            _.each(_artworks, function (artwork) {

                _.each(stickers, function (sticker) {

                    if (artwork.get("sticker") === sticker.id) {

                        _story.stickerName = sticker.get("stickerName");
                        if (sticker.get("uri")) {
                            _story.stickerUrl = sticker.get("uri").url();
                        } else {
                            _story.stickerUrl = "";
                        }
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