let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let moment = require('moment');
let multer = require('multer');
let fs = require('fs');

const STICKER = "sticker";
const STORIES = "story";

module.exports = function (app) {

    app.get('/feed/history/:type', function (req, res) {

        let token = req.cookies.token;
        let feedType = req.params.type;
        let stickers = [];
        let stories = [];
        let artWork = [];
        let date = [];
        let combined = [];
        let _story;
        let _allArtwork;
        let sticker = "sticker";
        let story = "story";

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.History).find();

            }).then(function (histories) {

                _.each(histories, function (history, index) {
                    if (history.get("type") === type.FEED_TYPE.story) {
                        stories.push(history.get("itemId"));
                        date[index] = moment(history.get("createdAt")).format('LL');

                    } else if (history.get("type") === type.FEED_TYPE.sticker) {
                        stickers.push(history.get("itemId"));
                        date[index] = moment(history.get("createdAt")).format('LL');

                    }
                });

                switch (feedType) {
                    case sticker:
                        return new Parse.Query(_class.Stickers).containedIn("objectId", stickers).find();

                    case story:
                        return new Parse.Query(_class.Stories).containedIn("objectId", stories).find();

                }

            }).then(function (items) {
                _story = items;

                switch (feedType) {
                    case sticker:
                        res.render("pages/feed/history", {
                            items: items,
                            feedType: feedType,
                            date: date,
                            type: type

                        });
                        break;

                    case story:
                        return new Parse.Query(_class.ArtWork).find()

                }
            }).then(function (artworks) {

                _allArtwork = artworks;

                _.each(artworks, function (artwork) {

                    _.each(_story, function (story) {

                        if (artwork.get("itemId") === story.id) {
                            artWork.push(artwork.get("stickerId"));
                        }
                    })

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

                res.render("pages/feed/history", {
                    items: _story,
                    feedType: feedType,
                    date: date,
                    type: type,
                    combined: combined

                });
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/');
            })
        } else {
            res.redirect('/');

        }

    });

    app.post('/feeds/:type/:origin', function (req, res) {

        let token = req.cookies.token;
        let feedType = req.params.type;
        let origin = req.params.origin;
        let id = req.body.element_id;
        let storyPage = "story";

        if (token) {

            getUser(token).then(function (sessionToken) {
                switch (feedType) {
                    case STICKER:
                        return new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first();

                    case STORIES:
                        return new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first();

                }

            }).then(function (latest) {

                latest.set("feedId", id);

                return latest.save();

            }).then(function () {

                let Selected = new Parse.Object.extend(_class.History);
                let selected = new Selected();

                switch (feedType) {
                    case STICKER:
                        selected.set("type", 0);
                        selected.set("itemId", id);
                        break;
                    case STORIES:
                        selected.set("type", 1);
                        selected.set("itemId", id);
                        break;
                }

                return selected.save();

            }).then(function () {

                switch (feedType) {
                    case STICKER:
                        return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();
                    case STORIES:
                        if (origin === storyPage) {
                            res.redirect('/notification/' + id + '/' + feedType + '/' + origin);

                        } else {
                            res.redirect('/notification/' + id + '/' + feedType + '/' + origin);
                        }
                }

            }).then(function (sticker) {

                if (sticker.get("description") === "" || sticker.get("description") === undefined) {
                    res.render("pages/stickers/add_description", {
                        sticker: sticker,
                        origin: origin
                    })
                } else {
                    res.redirect('/notification/' + id + '/' + feedType + '/' + origin);

                }

            }, function (error) {

                console.log("ERROR: FEED CHANGE FAILED " + error.message);
                switch (feedType) {
                    case STICKER:
                        res.redirect('/feed/sticker');
                        break;

                    case STORIES:
                        res.redirect('/feed/story');
                        break;
                }

            });
        } else {

            res.redirect('/');

        }

    });

    app.get('/notification/:id/:type/:origin', function (req, res) {

        let token = req.cookies.token;
        let notificationType = req.params.type;
        let id = req.params.id;
        let origin = req.params.origin;
        let storyPage = "story";
        let _story = {};

        if (token) {

            util.getUser(token).then(function (sessionToken) {
                switch (notificationType) {
                    case STORIES:
                        return Parse.Promise.when(
                            new Parse.Query(_class.Stories).equalTo("objectId", id).first(),
                            new Parse.Query(_class.ArtWork).equalTo("itemId", id).first()
                        );

                    case STICKER:
                        return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();

                }
            }).then(function (item, artwork) {

                switch (notificationType) {
                    case STORIES:
                        _story = item;
                        return new Parse.Query(_class.Stickers).equalTo("objectId", artwork.get("stickerId")).first();

                    case STICKER:
                        return item;
                }
            }).then(function (sticker) {

                switch (notificationType) {
                    case STORIES:

                        let story = create.Story(_story);
                        story = create.StoryArtwork(story, sticker);

                        notification.send({
                            title: story.title,
                            description: story.summary,
                            activity: "STORY_ACTIVITY",
                            data: {
                                id: story.id,
                                title: story.title,
                                stickerUrl: story.stickerUrl,
                                summary: story.summary,
                                topColor: story.topColor,
                                bottomColor: story.bottomColor,
                                type: notificationType
                            },

                            //TODO retrieve first section from Server
                            topic: process.env.TOPIC_PREFIX + "feed.story"

                        }).then(function (success) {

                            console.log("STORY NOTIFICATION WAS SENT SUCCESSFULLY");

                        }, function (status) {

                            console.log("STORY NOTIFICATION WASN'T SENT " + status);

                        });

                        if (origin === storyPage) {
                            res.redirect('/storyedit/' + id);
                        } else {
                            res.redirect('/home');
                        }
                        break;

                    case STICKER:

                        let _sticker = create.Sticker(sticker);
                        notification.send({
                            title: "Sticker Of the Day",
                            description: _sticker.description,
                            activity: "STICKER_ACTIVITY",
                            data: {
                                id: _sticker.id,
                                name: _sticker.name,
                                url: _sticker.url,
                                type: notificationType
                            },
                            //TODO retrieve first section from Server
                            topic: process.env.TOPIC_PREFIX + "feed.sticker"
                        }).then(function (success) {

                            console.log("STICKER NOTIFICATION WAS SENT SUCCESSFULLY");

                        }, function (status) {

                            console.log("STICKER NOTIFICATION WASN'T SENT " + status);

                        });


                        res.redirect('/home');
                        break;
                }
            })
        } else {
            res.redirect('/');
        }

        //TODO type by id

    });

    app.get('/feed/sticker', function (req, res) {

        let token = req.cookies.token;
        let _user = {};

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                let query = new Parse.Query(_class.Stickers);
                query.equalTo("sold", false);
                query.equalTo("userId", _user.id);
                return query.find();

            }).then(function (stickers) {

                res.render("pages/stickers/sticker_of_day", {
                    stickers: stickers
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home');
            })
        } else {
            res.redirect('/');

        }
    });

    app.get('/feed/story', function (req, res) {

        let token = req.cookies.token;
        let _stories = [];
        let artWork = [];
        let _allArtwork = [];
        let combined = [];
        let _user = {};

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Stories).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.ArtWork).find()
                )

            }).then(function (stories, artworks) {

                _allArtwork = artworks;

                if (_stories) {

                    _.each(stories, function (story) {
                        if (story.get("published") === true) {

                            _stories.push(story);

                        }
                    });

                    _.each(artworks, function (artwork) {

                        artWork.push(artwork.get("stickerId"));

                    });

                    return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find();

                } else {
                    res.render("pages/stories/story_of_day", {

                        stories: [],
                        artworks: []

                    });
                }

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

                res.render("pages/stories/story_of_day", {

                    stories: _stories,
                    artworks: combined

                });


            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home');
            })
        } else {
            res.redirect('/');

        }
    });
};