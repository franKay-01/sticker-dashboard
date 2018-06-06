let util = require("../modules/util");
let helpers = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');

let PacksClass = "Packs";
let StoriesClass = "Stories";
let StoryItemClass = "StoryItem";
let ArtWorkClass = "ArtWork";
let StickersClass = "Stickers";

//TODO remove all archived items
//TODO remove all flagged items
//TODO write pagination function for editing stickers

Parse.Cloud.define("getPacks", function (req, res) {

    let _packs = [];

    //TODO use default pack env variable
    return new Parse.Query(PacksClass).equalTo("user_id", process.env.ADMIN).notEqualTo("objectId", "hB39Hhb16O").find({useMasterKey: true})
        .then(function (packs) {

            _packs = packs;
            let promises = [];
            _.map(packs, function (pack) {
                promises.push(pack.relation(PacksClass).query().limit(5).find({useMasterKey: true}));
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
                packItem.id = pack.id;
                packItem.name = pack.get("pack_name");
                packItem.description = pack.get("pack_description");

                let _artwork = pack.get("art_work");
                if (_artwork) {
                    packItem.artwork = _artwork.url();
                } else {
                    packItem.artwork = "";
                }

                let _stickers = [];
                _.map(stickerList, function (stickers) {

                    if (stickers.length) {


                        _.map(stickers, sticker => {

                            if (pack.id === sticker.get("parent").id) {
                                _stickers.push({id: sticker.id, url: sticker.get("uri").url()});
                            }

                        });

                        console.log("INFORMATION_NINE " + JSON.stringify(_stickers));
                        packItem.previews = _stickers;

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

        return new Parse.Query(StickersClass).equalTo("objectId", sticker.get("sticker")).first({useMasterKey: true});

    }).then(function (sticker) {

        if (_story && sticker && _storyItems) {

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

            if (_storyItems.length) {
                let _stories = [];
                _.each(_storyItems, storyItem => {
                    _stories.push({id: storyItem.id, content: storyItem.get("content"), type: storyItem.get("type")});
                });
                story.stories = _stories;
            }


            res.success(util.setResponseOk(story));

        } else {

            util.handleError(res, util.setErrorType(util.STORY_PREVIEW_ERROR));

        }

    }, function (error) {

        util.handleError(res, error);

    })

});

Parse.Cloud.define("getStoryItems", function (req, res) {

    let storyId = req.params.storyId;

    Parse.Promise.when(
        new Parse.Query(StoryItemClass).equalTo("story_id", storyId).find({useMasterKey: true})
    ).then(storyItems => {

        let _storyItems = [];

        if (storyItems.length) {

            _.each(storyItems, storyItem => {
                _storyItems.push({
                    id: storyItem.id,
                    content: storyItem.get("content"),
                    type: parseInt(storyItem.get("type"))
                });
            });

            res.success(util.setResponseOk(_storyItems));

        } else {

            //TODO write proper error type
            util.handleError(res, util.setErrorType(util.STORY_PREVIEW_ERROR));
        }

    }, error => {

        util.handleError(res, error);

    })

});

Parse.Cloud.define("getStories", function (req, res) {

    let _stories = [];
    let stickerIds = [];
    let _artworks = [];
    let storyList = [];

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

                _story.stickerName = "";
                _story.stickerUrl = "";
                _.each(stickers, function (sticker) {

                    if (artwork.get("sticker") === sticker.id) {
                        console.log("ARTWORK STICKER " + artwork.get("sticker") + " " + "STICKER " + sticker.id);
                        _story.stickerName = sticker.get("stickerName");
                        if (sticker.get("uri")) {
                            _story.stickerUrl = sticker.get("uri").url();
                        } else {
                            _story.stickerUrl = "";
                        }
                    }
                })
            });

            storyList.push(_story);

        });

        res.success(util.setResponseOk(storyList));

    }, error => {

        util.handleError(res, error);

    });

});


Parse.Cloud.define("getStickers", function (req, res) {

    let packId = req.params.packId;

    // var user = req.user;
    return new Parse.Query(PacksClass).equalTo("objectId", packId).first({useMasterKey: true})
        .then(function (pack) {

            let stickers = pack.relation(PacksClass);
            return stickers.query().find({useMasterKey: true});

        }).then(function (stickers) {

            if (stickers.length) {

                let stickerPaidList = [];
                let stickerFreeList = [];

                _.each(stickers, sticker => {

                    let _sticker = {};
                    _sticker.id = sticker.id;
                    _sticker.name = sticker.get("stickerName");
                    _sticker.categories = sticker.get("categories");

                    let sold = Boolean(sticker.get("sold"));

                    if ((sold === "true") || (sold === true)) {
                        _sticker.sold = true;
                        stickerPaidList.push(_sticker)
                    } else {
                        _sticker.sold = false;
                        stickerFreeList.push(_sticker)
                    }

                    if (sticker.get("uri")) {
                        _sticker.url = sticker.get("uri").url();
                    } else {
                        _sticker.url = "";
                    }

                });

                res.success(util.setResponseOk({paid: stickerPaidList, free: stickerFreeList}));

            } else {

                //TODO write proper error type
                util.handleError(res, util.setErrorType(util.STORY_PREVIEW_ERROR));
            }

            res.success(util.setResponseOk(stickers));

        }, function (error) {

            util.handleError(res, error);
        });

});