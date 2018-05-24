let util = require("../modules/util");
var helpers = require("../modules/helpers");
var _ = require('underscore');
var stickers = require("../modules/stickers");


let PacksClass = "Packs";


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

