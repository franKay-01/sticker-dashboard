let util = require("../modules/util");
var helpers = require("../modules/helpers");
var _ = require('underscore');
var stickers = require("../modules/stickers");


let PacksClass = "Packs";

Parse.Cloud.define("getStickers", function (req, res) {

    // var user = req.user;
    return new Parse.Query(PacksClass).equalTo("objectId", "EksXNOeVKj").first({useMasterKey: true})
        .then(function (pack) {

            let stickers = pack.relation(PacksClass);
            return stickers.query().find({useMasterKey: true});

        }).then(function (stickers) {

            res.success(util.setResponseOk(stickers));

        }, function (error) {

            util.handleError(res, error);
        });

});

Parse.Cloud.define("getSticker", function (req, res) {

    let stickerId = req.params.stickerId;
    // var user = req.user;

    stickers.findById(stickerId).then(function (badge) {

        res.success(util.setResponseOk(badge));

    }, function (error) {

        util.handleError(res, error);

    });

});

Parse.Cloud.define("getStory", function (req, res) {

    let StoryClass = "Stories";
    let ArtWorkClass = "ArtWork";
    let StoryCatalogue = "StoryCatalogue";
    let StickerClass = "Stickers";
    let _story = {};
    let _storyCatalogue = [];

    let storyId = req.params.storyId;
    let data = {};

    Parse.Promise.when(
        new Parse.Query(StoryClass).equalTo("objectId", storyId).first(),
        new Parse.Query(ArtWorkClass).equalTo("object_id", storyId).first(),
        new Parse.Query(StoryCatalogue).equalTo("story_id", storyId).find()
    ).then(function (story, sticker, storyCatalogue) {

        _story = story;
        _storyCatalogue = storyCatalogue;

        return new Parse.Query(StickerClass).equalTo("objectId", sticker.get("sticker")).first();

    }).then(function (sticker) {

        if (_story && sticker && _storyCatalogue) {

            data.story = _story;
            data.sticker = sticker;

            data.stories = [];
            if (_storyCatalogue.length) {
                data.stories = _storyCatalogue;
            }

            res.success(util.setResponseOk(data));

        } else {

            util.handleError(res, util.setErrorType(util.STORY_PREVIEW_ERROR));

        }

    }, function (error) {

        util.handleError(res, error);

    })

});

