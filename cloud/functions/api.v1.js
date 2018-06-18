let util = require("../modules/util");
let helpers = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');
let create = require("../modules/create");
let _class = require("../modules/classNames");


//environment cars
const LATEST_STICKER = process.env.LATEST_STICKER;
const LATEST_STORY = process.env.LATEST_STORY;
const ADMIN = process.env.ADMIN;
const DEFAULT_PACK = process.env.DEFAULT_PACK;

//TODO remove all archived items
//TODO remove all flagged items
//TODO write pagination function for editing stickers
//TODO remove repeated code for creating stories/stickers
//TODO properly handle errors

Parse.Cloud.define("getFeed", function (req, res) {

    let feed = {};
    let _sticker;
    let _story;
    let _packs;
    let _categories;
    let _adverts;
    let advertList = [];

    Parse.Promise.when(
        new Parse.Query(_class.Latest).equalTo("objectId", LATEST_STICKER).first({useMasterKey: true}),
        new Parse.Query(_class.Latest).equalTo("objectId", LATEST_STORY).first({useMasterKey: true}),
        new Parse.Query(_class.Packs).equalTo("user_id", ADMIN).notEqualTo("objectId", DEFAULT_PACK).limit(2).find({useMasterKey: true}),
        new Parse.Query(_class.Categories).ascending("name").limit(30).find(),
        new Parse.Query(_class.Adverts).find()
    ).then((sticker, story, packs, categories, adverts) => {

        _packs = packs;
        _categories = categories;
        _adverts = adverts;

        console.log("ADVERTIFY ",JSON.stringify(_adverts));

        return Parse.Promise.when(
            new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("latest_id")).first({useMasterKey: true}),
            new Parse.Query(_class.Stories).equalTo("objectId", story.get("latest_id")).first({useMasterKey: true}),
            new Parse.Query(_class.ArtWork).equalTo("object_id", story.get("latest_id")).first({useMasterKey: true}),
        );

    }).then((sticker, story, storyArtwork) => {

        _sticker = sticker;
        _story = story;
        let advertIds = [];

        _.each(_adverts, advert => {
            advertIds.push(advert.id)
        });

        return Parse.Promise.when(
            new Parse.Query(_class.Stickers).equalTo("objectId", storyArtwork.get("sticker")).first({useMasterKey: true}),
            new Parse.Query(_class.StoryItems).equalTo("story_id", story.id).find({useMasterKey: true}),
            new Parse.Query(_class.AdvertImages).containedIn("advert_id", advertIds).find({useMasterKey: true}),
            new Parse.Query(_class.Links).containedIn("object_id", advertIds).find({useMasterKey: true})
        );

    }).then((sticker, storyItems, advertImages, links) => {


        feed.stickerOfDay = create.Sticker(_sticker);
        feed.latestStory = create.Story(_story, sticker, storyItems);

        _.each(_adverts, advert => {
            advertList.push(create.Adverts(advert, advertImages, links));
        });

        let promises = [];
        _.map(_packs, function (pack) {
            promises.push(pack.relation(_class.Packs).query().limit(5).find({useMasterKey: true}));
        });

        return Parse.Promise.when(promises);

    }).then(stickerList => {

        let packList = [];
        let categoryList = [];

        _.map(_packs, pack => {
            packList.push(create.Pack(pack, stickerList))
        });

        _.map(_categories, category => {
            categoryList.push(create.Category(category))
        });

        feed.packs = packList;
        feed.categories = categoryList;
        feed.adverts = advertList;

        res.success(util.setResponseOk(feed));

    }, error => {

        util.handleError(res, error);

    })

});

Parse.Cloud.define("getCategories", function (req, res) {

    new Parse.Query(_class.Categories).ascending("name").limit(1000).find().then(categories => {

        let categoryList = [];

        _.map(categories, category => {
            categoryList.push(create.Category(category))
        });

        res.success(util.setResponseOk(categoryList));

    }, error => {
        util.handleError(res, error);
    })

});

Parse.Cloud.define("getPacks", function (req, res) {

    let _packs = [];

    //TODO use default pack env variable
    return new Parse.Query(_class.Packs).equalTo("user_id", ADMIN).notEqualTo("objectId", DEFAULT_PACK).find({useMasterKey: true})
        .then(function (packs) {

            _packs = packs;
            let promises = [];
            _.map(packs, function (pack) {
                promises.push(pack.relation(_class.Packs).query().limit(5).find({useMasterKey: true}));
            });

            return Parse.Promise.when(promises);

        }).then(function (stickerList) {

            let packList = [];

            //TODO check if pack is published
            //TODO check if pack has not been archived
            _.map(_packs, pack => {
                packList.push(create.Pack(pack, stickerList));
            });

            //TODO properly handle error
            res.success(util.setResponseOk(packList));

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
        new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey: true}),
        new Parse.Query(_class.ArtWork).equalTo("object_id", storyId).first({useMasterKey: true}),
        new Parse.Query(_class.StoryItems).equalTo("story_id", storyId).find({useMasterKey: true})
    ).then(function (story, sticker, storyItems) {

        _story = story;
        _storyItems = storyItems;

        return new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("sticker")).first({useMasterKey: true});

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

            //TODO add storyItem to create.js
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
        new Parse.Query(_class.StoryItems).equalTo("story_id", storyId).find({useMasterKey: true})
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
        new Parse.Query(_class.Stories).equalTo("user_id", ADMIN).find({useMasterKey: true}),
        new Parse.Query(_class.StoryItems).find()
    ).then((stories, artworks) => {

        _stories = stories;
        _artworks = artworks;

        _.each(artworks, artwork => {

            //TODO add type:Number=[short story, comic etc] to story
            //TODO update sticker to stickerId
            stickerIds.push(artwork.get("sticker"));

        });

        return new Parse.Query(_class.Stickers).containedIn("objectId", stickerIds).find({useMasterKey: true});

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

                    if (artwork.get("sticker") === sticker.id && artwork.get("object_id") === story.id) {

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
    return new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true})
        .then(function (pack) {

            let stickers = pack.relation(_class.Packs);
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

                    let sold = sticker.get("sold");

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