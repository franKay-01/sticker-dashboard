let helper = require('../cloud/modules/helpers');
let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');

const NORMAL_USER = 2;
const SUPER_USER = 0;
const MK_TEAM = 1;

let errorMessage = "";

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

    app.get('/', function (req, res) {

        let token = req.cookies.token;

        //utility render__ function to appending appId and serverURL
        const render__ = (_stickers, _error) => {
            res.render("pages/accounts/login",
                {
                    stickers: _stickers,
                    appId: process.env.APP_ID,
                    serverURL: PARSE_SERVER_URL,
                    error: _error
                });
        };

        if (token) {

            util.getUser(token).then(sessionToken => {

                _user = sessionToken.get("user");

                res.redirect("/home");

            });

        } else {

            return new Parse.Query(_class.Packs).equalTo("objectId", process.env.DEFAULT_PACK).first().then(function (pack) {

                if (pack) {

                    console.log("PACK " + JSON.stringify(pack));

                    let col = pack.relation(_class.Packs);
                    return col.query().limit(40).find();

                } else {
                    return []
                }

            }).then(function (stickers) {

                if (stickers.length) {

                    console.log("STICKERS " + JSON.stringify(stickers));

                    stickers = helper.shuffle(stickers);
                    stickers = stickers.slice(0, 3);

                    if (errorMessage === "") {
                        render__(stickers, []);

                    } else {
                        render__(stickers, errorMessage);
                        // res.render("pages/login", {stickers: stickers, error: errorMessage});
                    }

                } else {
                    render__([], "");
                }

            }, function (error) {
                render__([], error.message)
            });

        }

    });

    app.post('/author', function (req, res) {

        let token = req.cookies.token;
        let name = req.body.authorName;
        let email = req.body.authorEmail;
        let phone = req.body.authorNumber;
        let socialMedia = req.body.authorSocial;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                let Author = new Parse.Object.extend(_class.Authors);
                let author = new Author();

                author.set("name", name);
                author.set("email", email);
                author.set("phone", phone);
                author.set("socialHandles", socialMedia);

                return author.save();

            }).then(function (author) {

                res.redirect('/authors');

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home')
            })

        } else {
            res.redirect('/');
        }
    });

    app.get('/author/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Authors).equalTo("objectId", id).first();

            }).then(function (author) {

                res.render("pages/accounts/edit_author", {
                    author: author
                })
            }, function (error) {
                res.redirect('/');
            })

        } else {

            res.redirect('/');

        }
    });

    app.post('/author/edit/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let name = req.body.authorName;
        let email = req.body.authorEmail;
        let phone = req.body.authorNumber;
        let socialMedia = req.body.socialMedia;

        console.log("NAME " + name + email + phone + socialMedia);

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Authors).equalTo("objectId", id).first();

            }).then(function (author) {

                author.set("name", name);
                author.set("email", email);
                author.set("phone", phone);
                author.set("socialHandles", socialMedia);

                return author.save();

            }).then(function (author) {

                res.redirect('/author/' + author.id);

            }, function (error) {

                console.log("ERROR ON AUTHOR" + error.message);
                res.redirect('/author/' + id);
            })

        } else {
            res.redirect('/');
        }
    });

    app.get('/author/view/:authorId/:storyId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.authorId;
        let storyId = req.params.storyId;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Authors).equalTo("objectId", id).first();

            }).then(function (author) {

                res.render("pages/stories/view_author", {
                    author: author,
                    storyId: storyId
                })
            }, function (error) {
                res.redirect('/storyedit/' + storyId);
            })
        } else {

            res.redirect('/');

        }
    });

    app.get('/authors', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Authors).find();

            }).then(function (authors) {

                res.render("pages/accounts/authors", {
                    authors: authors
                });
            });

        } else {
            res.redirect('/');
        }
    });

};