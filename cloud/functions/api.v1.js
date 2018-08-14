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
const SERVER_URL = process.env.SERVER_URL.replace('parse', '');


//TODO properly handle errors
//TODO handle instances when ID's have not been provided
//TODO retrieve API Version and Device Type from req

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
        new Parse.Query(_class.Packs).equalTo("published", true).equalTo("userId", ADMIN).notEqualTo("objectId", DEFAULT_PACK).limit(2).descending("createdAt").find({useMasterKey: true}),
        new Parse.Query(_class.Categories).ascending("name").limit(30).find(),
        new Parse.Query(_class.Adverts).find(),
        new Parse.Query(_class.Product).find(),
    ).then((sticker, story, packs, categories, adverts, products) => {

        _packs = packs;
        _categories = categories;
        _adverts = adverts;

        return Parse.Promise.when(
            new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first({useMasterKey: true}),
            new Parse.Query(_class.Stories).equalTo("published", true).equalTo("objectId", story.get("feedId")).first({useMasterKey: true}),
            new Parse.Query(_class.ArtWork).equalTo("itemId", story.get("feedId")).first({useMasterKey: true}),
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
            new Parse.Query(_class.StoryItems).equalTo("storyId", story.id).find({useMasterKey: true}),
            new Parse.Query(_class.AdvertImages).containedIn("advert_id", advertIds).find({useMasterKey: true}),
            new Parse.Query(_class.Links).containedIn("itemId", advertIds).find({useMasterKey: true})
        );

    }).then((sticker, storyItems, advertImages, links) => {

        feed.stickerOfDay = create.Sticker(_sticker);
        let _latestStory = create.Story(_story);
        _latestStory.stories = create.StoryItems(storyItems);
        feed.latestStory = create.StoryArtwork(_latestStory, sticker);

        _.each(_adverts, advert => {
            advertList.push(create.Adverts(advert, links, advertImages));
        });

        let promises = [];
        _.map(_packs, function (pack) {
            promises.push(pack.relation(_class.Packs).query().limit(4).find({useMasterKey: true}));
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

        console.log("FEED ERROR " + error.message);

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
    return new Parse.Query(_class.Packs).equalTo("published", true).equalTo("userId", ADMIN).notEqualTo("objectId", DEFAULT_PACK).descending("createdAt").find({useMasterKey: true})
        .then(function (packs) {

            _packs = packs;
            let promises = [];
            _.map(packs, function (pack) {
                promises.push(pack.relation(_class.Packs).query().limit(4).find({useMasterKey: true}));
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
        new Parse.Query(_class.Stories).equalTo("published", true).equalTo("objectId", storyId).first({useMasterKey: true}),
        new Parse.Query(_class.ArtWork).equalTo("itemId", storyId).first({useMasterKey: true}),
        new Parse.Query(_class.StoryItems).equalTo("storyId", storyId).find({useMasterKey: true})
    ).then(function (story, sticker, storyItems) {

        _story = story;
        _storyItems = storyItems;

        return new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first({useMasterKey: true});

    }).then(function (sticker) {

        if (_story && sticker && _storyItems) {

            let story = create.Story(_story);
            story.stories = create.StoryItems(_storyItems);
            story = create.StoryArtwork(story, sticker);

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
        new Parse.Query(_class.StoryItems).equalTo("storyId", storyId).find({useMasterKey: true})
    ).then(storyItems => {


        if (storyItems.length) {

            res.success(util.setResponseOk(create.StoryItems(storyItems)));

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
        new Parse.Query(_class.Stories).equalTo("published", true).equalTo("userId", ADMIN).descending("createdAt").find({useMasterKey: true}),
        new Parse.Query(_class.ArtWork).find()
    ).then((stories, artworks) => {

        _stories = stories;
        _artworks = artworks;

        _.each(artworks, artwork => {

            stickerIds.push(artwork.get("stickerId"));

        });

        return new Parse.Query(_class.Stickers).containedIn("objectId", stickerIds).find({useMasterKey: true});

    }).then(stickers => {


        _.each(_stories, function (story) {

            let _story = create.Story(story);

            _.each(_artworks, function (artwork) {

                _.each(stickers, function (sticker) {

                    if (artwork.get("stickerId") === sticker.id && artwork.get("itemId") === story.id) {
                        _story = create.StoryArtwork(_story, sticker);

                    }
                })
            });

            storyList.push(_story);

        });

        if (storyList.length) {

            res.success(util.setResponseOk(storyList));

        } else {

            util.handleError(res, util.STORIES_ERROR);

        }

    }, error => {

        util.handleError(res, error);

    });

});


Parse.Cloud.define("getStickers", function (req, res) {

    let packId = req.params.packId;

    // var user = req.user;
    return new Parse.Query(_class.Packs).equalTo("published", true).equalTo("objectId", packId).first({useMasterKey: true})
        .then(function (pack) {

            let stickers = pack.relation(_class.Packs);
            return stickers.query().find({useMasterKey: true});

        }).then(function (stickers) {

            if (stickers.length) {

                let stickerPaidList = [];
                let stickerFreeList = [];

                _.each(stickers, sticker => {

                    let _sticker = create.Sticker(sticker);

                    if (_sticker.sold) {
                        stickerPaidList.push(_sticker)
                    } else {
                        stickerFreeList.push(_sticker)
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