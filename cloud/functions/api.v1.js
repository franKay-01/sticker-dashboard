let util = require("../modules/util");
let helpers = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');
let create = require("../modules/create");
let _class = require("../modules/classNames");
let analytics = require("../modules/analytics");


//environment cars
const LATEST_STICKER = process.env.LATEST_STICKER;
const LATEST_STORY = process.env.LATEST_STORY;
const ADMIN = process.env.ADMIN;
const DEFAULT_PACK = process.env.DEFAULT_PACK;
const SHARE_URL = "";


//TODO properly handle errors
//TODO handle instances when ID's have not been provided
//TODO retrieve API Version and Device Type from req

Parse.Cloud.define("getFeed", function (req, res) {

    let feed = {};
    let _sticker = {};
    let _story = {};
    let _packs = [];

    Parse.Promise.when(
        new Parse.Query(_class.Latest).equalTo("objectId", LATEST_STICKER).first({useMasterKey: true}),
        new Parse.Query(_class.Latest).equalTo("objectId", LATEST_STORY).first({useMasterKey: true}),
        new Parse.Query(_class.Packs).equalTo("published", true).equalTo("userId", ADMIN).limit(4).descending("createdAt").find({useMasterKey: true}),
    ).then((sticker, story, packs) => {

        if (sticker && story && packs) {

            _packs = packs;

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first({useMasterKey: true}),
                new Parse.Query(_class.Stories).equalTo("published", true).equalTo("objectId", story.get("feedId")).first({useMasterKey: true}),
                new Parse.Query(_class.ArtWork).equalTo("itemId", story.get("feedId")).first({useMasterKey: true}),
            );

        } else {

            util.handleError(res, util.setErrorType(util.FEED_ERROR));
        }

    }).then((sticker, story, storyArtwork) => {

        if (sticker && story && storyArtwork) {

            _sticker = sticker;
            _story = story;

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).equalTo("objectId", storyArtwork.get("stickerId")).first({useMasterKey: true}),
                new Parse.Query(_class.StoryItems).equalTo("storyId", story.id).find({useMasterKey: true})
            );

        } else {

            util.handleError(res, util.setErrorType(util.FEED_ERROR_ONE));

        }

    }).then((sticker, storyItems) => {

        if (sticker && storyItems) {

            feed.stickerOfDay = create.Sticker(_sticker);
            let _latestStory = create.Story(_story);

            _latestStory.stories = create.StoryItems(storyItems);
            feed.latestStory = create.StoryArtwork(_latestStory, sticker);

            let packList = [];

            _.map(_packs, pack => {
                packList.push(create.Pack(pack))
            });


            feed.packs = packList;

            res.success(util.setResponseOk(feed));

        } else {

            util.handleError(res, util.setErrorType(util.FEED_ERROR_TWO));

        }

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

    return new Parse.Query(_class.Packs).equalTo("published", true).equalTo("userId", ADMIN).descending("createdAt").find({useMasterKey: true})
        .then((packs) => {

            if (packs.length) {

                let _packs = [];

                _.map(packs, function (pack) {
                    _packs.push(create.Pack(pack));
                });

                res.success(util.setResponseOk(_packs));

            } else {

                util.handleError(res, util.setErrorType(util.PACKS_ERROR));

            }

        }, (error) => {

            util.handleError(res, error);
        });

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

        return Parse.Promise.when(
            new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first({useMasterKey: true}),
            analytics.request({
                reference: analytics.FIREBASE_REFERENCE.story,
                type: analytics.ANALYTIC_TYPE.views,
                id: storyId,
                request: analytics.REQUEST_TYPE.get,

            })
        )

    }).then(function (sticker, analytics) {

        if (_story && sticker && _storyItems) {

            let story = create.Story(_story);
            story.stories = create.StoryItems(_storyItems);
            story = create.StoryArtwork(story, sticker);
            story.views = analytics.snapshot;

            res.success(util.setResponseOk(story));

        } else {

            util.handleError(res, util.setErrorType(util.STORIES_ERROR));

        }

    }, function (error) {

        util.handleError(res, error);

    })

});

Parse.Cloud.define("getStoryItems", function (req, res) {

    let storyId = req.params.storyId;

    Parse.Promise.when(
        new Parse.Query(_class.StoryItems).equalTo("storyId", storyId).ascending("createdAt").find({useMasterKey: true}),
        analytics.request({
            reference: analytics.FIREBASE_REFERENCE.story,
            type: analytics.ANALYTIC_TYPE.views,
            id: storyId,
            request: analytics.REQUEST_TYPE.set,

        })
    ).then((storyItems) => {

        if (storyItems.length) {

            res.success(util.setResponseOk(create.StoryItems(storyItems)));

        } else {

            //TODO write proper error type
            util.handleError(res, util.setErrorType(util.STORIES_ERROR));
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

        if (stories.length) {

            console.log("GOT STICKER AND ARTWORK");

            _stories = stories;
            _artworks = artworks;

            _.each(artworks, artwork => {

                stickerIds.push(artwork.get("stickerId"));

            });

            return new Parse.Query(_class.Stickers).containedIn("objectId", stickerIds).find({useMasterKey: true});

        } else {

            console.log("ERROR ONE");

            util.handleError(res, util.setErrorType(util.STORIES_ERROR));

        }

    }).then(stickers => {

        if (stickers.length) {

            let storyIds = [];

            _.each(_stories, function (story) {

                console.log("GET STICKERS");

                let _story = create.Story(story);

                storyIds.push(_story.id);

                _.each(_artworks, function (artwork) {

                    console.log("GET ARTWORK");

                    _.each(stickers, function (sticker) {

                        console.log("GET ARTWORK STICKER");

                        if (artwork.get("stickerId") === sticker.id && artwork.get("itemId") === story.id) {
                            console.log("GET ARTWORK STICKER BY ID");
                            _story = create.StoryArtwork(_story, sticker);

                        }
                    })
                });

                storyList.push(_story);

            });

            return analytics.event({
                reference: analytics.FIREBASE_REFERENCE.story
            })

        } else {

            console.log("ERROR TWO");

            util.handleError(res, util.setErrorType(util.STORIES_ERROR));

        }

    }).then((items) => {



        if (items && storyList.length) {

            console.log("GET ANALYTICS");

            let data = analytics.data({
                items: items,
                type: analytics.ANALYTIC_TYPE_STRING.views
            });

            let stories = [];

            _.each(storyList, story => {

                console.log("ADD DATA");

                _.each(data, item => {
                    if (story.id === item.id) {
                        console.log("MUCH ID's " + item.id + " - " + story.id);
                        story.views = item.value
                    }
                });

                stories.push(story);

            });

            res.success(util.setResponseOk(stories));

        } else {

            console.log("ERROR THREE");

            util.handleError(res, util.STORIES_ERROR);

        }

    }, error => {

        console.log("ERROR FOUR");

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
                util.handleError(res, util.setErrorType(util.PACKS_ERROR));
            }

            res.success(util.setResponseOk(stickers));

        }, function (error) {

            util.handleError(res, error);
        });

});