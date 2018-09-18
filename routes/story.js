let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let _ = require('underscore');
let type = require('../cloud/modules/type');
let multer = require('multer');
let fs = require('fs');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("Dest " + JSON.stringify(file));
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

let upload = multer({storage: storage});

module.exports = function(app) {

    app.get('/stories', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            let _user = {};
            let art = {};
            let _story = [];
            let _allPack = [];
            let artWork = [];
            let _allArtwork = [];
            let combined = [];
            let _latest = "";

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Stories).equalTo("userId", _user.id).descending("createdAt").find(),
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.ArtWork).find(),
                    new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first()
                );


            }).then(function (story, allPack, artworks, latest) {

                _story = story;
                _allPack = allPack;
                _allArtwork = artworks;

                if (latest) {
                    _latest = latest;
                }


                _.each(artworks, function (artwork) {

                    artWork.push(artwork.get("stickerId"));

                });

                return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find();

            }).then(function (stickers) {

                _.each(_allArtwork, function (artworks) {

                    _.each(stickers, function (sticker) {

                        if (artworks.get("stickerId") === sticker.id) {

                            combined.push({
                                story: artworks.get("itemId"),
                                image: sticker.get("uri").url()
                            });
                        }
                    })
                });

                res.render("pages/stories/stories", {
                    story: _story,
                    allPacks: _allPack,
                    arts: combined,
                    latest: _latest,
                    type: type
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home');
            })
        } else {
            res.redirect('/');

        }
    });

    app.get('/storyitem/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Stories).equalTo("objectId", id).first()

            }).then(function (story) {

                res.render("pages/stories/story_catalogue", {

                    story_id: story.id,
                    name: story.get("title")

                });

            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/stories');
            });
        } else {
            console.log("COMING HOME");
            res.redirect('/');

        }
    });

    app.post('/storyItem/html/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let types = parseInt(req.body.style);
        let content = req.body.content;
        let color = req.body.color;
        let object = {};


        if (types === type.STORY_ITEM.text) {

            object = {"0": {"text": content}};

        } else if (types === type.STORY_ITEM.bold) {

            object = {"6": {"text": content}};

        } else if (types === type.STORY_ITEM.italic) {

            object = {"5": {"text": content}};

        } else if (types === type.STORY_ITEM.italicBold) {

            object = {"8": {"text": content}};

        } else if (types === type.STORY_ITEM.color) {

            //TODO String(type.)
            object = {"14": {"text": content, "color": "#" + color}};

        }

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (storyItem) {

                storyItem.get("contents").html.push(object);
                return storyItem.save();

            }).then(function (item) {

                res.redirect('/storyItem/html/old/' + item.id);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/');
            })
        } else {
            res.redirect('/');
        }
    });

    app.post('/storyItem/html/edit/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let storyId = req.body.id;
        let indexValue = req.body.indexValue;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (story_item) {

                console.log("SECOND STAGE " + JSON.stringify(story_item));

                let html = story_item.get("contents").html;
                for (let i = 0; i < html.length; i++) {
                    if (parseInt(indexValue) === i) {
                        let _html = html[i];
                        let typeOfObject = Object.keys(_html);
                        let content = Object.values(_html)[0];

                        console.log("THIRD STAGE " + typeOfObject + " AND " + JSON.stringify(content));

                        res.render("pages/stories/edit_html", {
                            type: type,
                            content: content,
                            objectType: typeOfObject,
                            story_id: storyId,
                            storyItemId: story_item.id,
                            index: indexValue
                        })
                    }
                }

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/storyitem/view/" + storyId);
            })
        } else {
            res.redirect('/');
        }

    });

    app.get('/storyItem/html/edit/:id/:storyId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let storyId = req.params.storyId;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (storyItem) {

                res.render("pages/stories/storyitem_html", {

                    storyItem: storyItem,
                    storyId: storyId

                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/storyitem/view/' + storyId);

            })
        } else {
            res.redirect('/');
        }

    });

    app.get('/storyItem/html/:state/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let state = req.params.state;
        let _story;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                if (state === "new") {
                    let Story = new Parse.Object.extend(_class.StoryItems);
                    let storyItem = new Story();

                    storyItem.set("type", type.STORY_ITEM.html);
                    storyItem.set("contents", {"html": []});
                    storyItem.set("storyId", id);

                    return storyItem.save();

                } else if (state === "old") {

                    return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

                }
                //product.set("productId", {"android": android, "ios": ios});

            }).then(function (storyItem) {

                _story = storyItem;

                if (state === "new") {

                    return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

                } else if (state === "old") {

                    return new Parse.Query(_class.Stories).equalTo("objectId", storyItem.get("storyId")).first();

                }

            }).then(function (story) {

                console.log("STORY ITEM " + JSON.stringify(story));

                res.render("pages/stories/story_html", {
                    name: story.get("title"),
                    storyItemId: _story.id,
                    storyId: story.id
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/storyitem/" + id);
            })

        } else {

            res.redirect('/');
        }
    });

    app.get('/storyitem/view/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let sticker_array = [];
        let _storyItem;
        let _stickers = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("storyId", id).find();

            }).then(function (story_item) {

                _storyItem = story_item;

                _.each(story_item, function (item) {
                    if (item.get("type") === type.STORY_ITEM.sticker) {
                        sticker_array.push(item.get("contents").id);
                    }
                });

                return true;

            }).then(function (image) {

                if (sticker_array.length > 0) {
                    return new Parse.Query(_class.Stickers).containedIn("objectId", sticker_array).find();

                } else {
                    return true;
                }

            }).then(function (stickers) {

                if (stickers) {

                    _stickers = stickers;

                }

                res.render("pages/stories/story_items", {

                    story_item: _storyItem,
                    story_id: id,
                    stickers: _stickers,

                });
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/storyedit/' + id)
            })
        }
    });

    app.post('/storyitem/html/update/:id', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.id;
        let htmlContent = req.body.htmlContent;
        let htmlColor = req.body.htmlColor;
        let story_id = req.body.id;
        let index = parseInt(req.body.index);

        if (token) {
            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (story_item) {

                let contents = story_item.get("contents");

                let _html = contents.html[index];
                let htmlType = Object.keys(_html);

                console.log("OBJECT TYPE " + htmlType);

                if (parseInt(htmlType) !== type.STORY_ITEM.color) {

                    let html = {};
                    html[htmlType.toString()] = {"text": htmlContent};
                    console.log("UPDATED HTML " + JSON.stringify(html));

                    contents.html[index] = html;

                } else {

                    let html = {};
                    html[htmlType.toString()] = {"text": htmlContent, "color": htmlColor};

                    contents.html[index] = html;
                }

                story_item.set("contents", contents);
                return story_item.save();

            }).then(function () {

                res.redirect('/storyitem/view/' + story_id);

            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/storyItem/html/edit/' + id);
            })
        }
    });

};