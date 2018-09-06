let helper = require('../cloud/modules/helpers');
let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');

const NORMAL_USER = 2;
const SUPER_USER = 0;
const MK_TEAM = 1;


module.exports = function(app) {

    app.get('/home', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            let _user = {};

            let _allPacks = [];
            let _story = [];
            let _collection = [];
            let _allAds = [];
            let _categories = [];
            let _messages = [];
            let _allProducts = [];
            let stickerId;
            let _latestSticker = "";
            let _latestStory = "";
            let _storyBody;
            let _stickerName;
            let _categoryLength = 0;
            let _packLength = 0;
            let _stickerLength = 0;
            let _storyLength = 0;
            const limit = 5;

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                if (_user.get("type") === MK_TEAM) {
                    res.redirect('/barcodes');
                }

                return Parse.Promise.when(
                    new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first(),
                    new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first(),
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).descending("createdAt").limit(limit).find(),
                    new Parse.Query(_class.Categories).limit(limit).find(),
                    new Parse.Query(_class.Stories).equalTo("userId", _user.id).descending("createdAt").limit(limit).find(),
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.Categories).count(),
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).count(),
                    new Parse.Query(_class.Stickers).equalTo("userId", _user.id).count(),
                    new Parse.Query(_class.Stories).equalTo("userId", _user.id).count(),
                    new Parse.Query(_class.Adverts).equalTo("userId", _user.id).limit(limit).find(),
                    new Parse.Query(_class.Message).limit(limit).find(),
                    new Parse.Query(_class.Product).limit(limit).find()
                );

            }).then(function (sticker, latestStory, collection, categories, story, allPacks, categoryLength, packLength,
                              stickerLength, storyLength, allAdverts, allMessages, products) {

                _categories = categories;
                _collection = collection;
                _story = story;
                _messages = allMessages;
                _allPacks = allPacks;
                _allAds = allAdverts;
                _allProducts = products;
                _categoryLength = helper.leadingZero(categoryLength);
                _packLength = helper.leadingZero(packLength);
                _stickerLength = helper.leadingZero(stickerLength);
                _storyLength = helper.leadingZero(storyLength);

                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first(),
                    new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first(),
                    new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first()
                );

            }).then(function (latestSticker, storyImage, storyBody) {


                _latestSticker = latestSticker.get("uri");
                _latestSticker['stickerName'] = latestSticker.get("name");
                _latestSticker['description'] = latestSticker.get("description");

                if (storyBody !== undefined) {

                    _storyBody = storyBody;

                } else {

                    _storyBody = "";

                }

                if (storyImage !== undefined) {
                    stickerId = storyImage.get("stickerId");

                    return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

                } else {
                    stickerId = "";

                    return stickerId;

                }

            }).then(function (sticker) {

                if (_user.get("type") === NORMAL_USER) {

                    res.render("pages/dashboard/home", {
                        collections: _collection,
                        allPacks: _allPacks,
                        allProducts: _allProducts,
                        story: _story,
                        categoryLength: _categoryLength,
                        packLength: _packLength,
                        stickerLength: _stickerLength,
                        storyLength: _storyLength,
                        name: _user.get("name"),
                        verified: _user.get("emailVerified"),
                        error_message: "null"

                    });

                } else if (_user.get("type") === SUPER_USER) {

                    res.render("pages/dashboard/admin_home", {
                        collections: _collection,
                        categories: _categories,
                        allAdverts: _allAds,
                        allProducts: _allProducts,
                        allPacks: _allPacks,
                        story: _story,
                        latestSticker: _latestSticker,
                        latestStory: sticker,
                        storyBody: _storyBody,
                        stickerName: _stickerName,
                        messages: _messages,
                        categoryLength: _categoryLength,
                        packLength: _packLength,
                        stickerLength: _stickerLength,
                        storyLength: _storyLength,
                        user_name: _user.get("name"),
                        verified: _user.get("emailVerified"),
                        error_message: "null",
                        type: type

                    });

                }

            }, function (error) {

                console.log("ERROR ON HOME " + error.message);

                res.render("pages/dashboard/admin_home", {
                    collections: _collection,
                    categories: _categories,
                    allAdverts: _allAds,
                    allProducts: _allProducts,
                    allPacks: _allPacks,
                    story: _story,
                    latestSticker: _latestSticker,
                    latestStory: "",
                    storyBody: _storyBody,
                    stickerName: _stickerName,
                    messages: _messages,
                    categoryLength: _categoryLength,
                    packLength: _packLength,
                    stickerLength: _stickerLength,
                    storyLength: _storyLength,
                    user_name: _user.get("name"),
                    verified: _user.get("emailVerified"),
                    error_message: "null"
                });
            });


        } else {
            console.log("BACK TO LOGIN ");
            res.redirect("/");
        }
    });
};