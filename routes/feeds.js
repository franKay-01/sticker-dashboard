let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let moment = require('moment');
let notification = require('../cloud/modules/notifications');
let create = require('../cloud/modules/create');

let _ = require('underscore');

const STICKER = "sticker";
const STORIES = "story";

module.exports = function (app) {

    app.get('/feed/history/:type/:projectId', function (req, res) {

        let token = req.cookies.token;
        let feedType = req.params.type;
        let projectId = req.params.projectId;
        let stickers = [];
        let stories = [];
        let artWork = [];
        let date = [];
        let combined = [];
        let _story;
        let _allArtwork;
        let _project;
        let sticker = "sticker";
        let story = "story";

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.History).equalTo("projectId", projectId).find(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                )

            }).then(function (histories, project) {

                _project = project;
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
                    combined: combined,
                    projectItem: _project

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
        let projectId = req.body.projectId;
        let storyPage = "story";
        let _user = {};

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                // switch (feedType) {
                //     case STICKER:
                //         return new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first();
                //
                //     case STORIES:
                //         return new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first();
                //
                // }

                switch (feedType) {
                    case STICKER:
                        return new Parse.Query(_class.Latest).equalTo("projectId", projectId).equalTo("userId", _user.id).equalTo("type", type.FEED_TYPE.sticker).first();

                    case STORIES:
                        return new Parse.Query(_class.Latest).equalTo("projectId", projectId).equalTo("userId", _user.id).equalTo("type", type.FEED_TYPE.story).first();

                }
            }).then(function (latest) {

                if (latest) {

                    latest.set("feedId", id);
                    return latest.save();

                } else {

                    let Latest = new Parse.Object.extend(_class.Latest);
                    let latest = new Latest();

                    latest.set("feedId", id);
                    latest.set("userId", _user.id);
                    latest.set("projectId", projectId);
                    if (feedType === STORIES) {

                        latest.set("type", type.FEED_TYPE.story);

                    } else if (feedType === STICKER) {

                        latest.set("type", type.FEED_TYPE.sticker);

                    }

                    return latest.save();
                }


            }).then(function () {

                let Selected = new Parse.Object.extend(_class.History);
                let selected = new Selected();

                switch (feedType) {
                    case STICKER:
                        selected.set("type", type.FEED_TYPE.sticker);
                        selected.set("itemId", id);
                        selected.set("projectId", projectId);
                        break;
                    case STORIES:
                        selected.set("type", type.FEED_TYPE.story);
                        selected.set("itemId", id);
                        selected.set("projectId", projectId);
                        break;
                }

                return selected.save();

            }).then(function () {

                switch (feedType) {
                    case STICKER:
                        return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();
                    case STORIES:
                        if (origin === storyPage) {
                            // res.redirect('/home/' + projectId);

                            res.redirect('/notification/' + id + '/' + feedType + '/' + origin + '/' + projectId);

                        } else {
                            // res.redirect('/home/' + projectId);

                            res.redirect('/notification/' + id + '/' + feedType + '/' + origin + '/' + projectId);
                        }
                }

            }).then(function (sticker) {

                if (sticker.get("description") === "" || sticker.get("description") === undefined) {
                    res.render("pages/stickers/add_description", {
                        sticker: sticker,
                        origin: origin,
                        projectId: projectId
                    })
                } else {
                    // res.redirect('/home/' + projectId);

                    res.redirect('/notification/' + id + '/' + feedType + '/' + origin + '/' + projectId);

                }

            }, function (error) {

                console.log("ERROR: FEED CHANGE FAILED " + error.message);
                switch (feedType) {
                    case STICKER:
                        res.redirect('/feed/sticker/' + projectId);
                        break;

                    case STORIES:
                        res.redirect('/feed/story/' + projectId);
                        break;
                }

            });
        } else {

            res.redirect('/');

        }

    });

    app.get('/notification/:id/:type/:origin/:projectId', function (req, res) {

        let token = req.cookies.token;
        let notificationType = req.params.type;
        let id = req.params.id;
        let origin = req.params.origin;
        let projectId = req.params.projectId;
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
                            res.redirect('/home/' + projectId);
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


                        res.redirect('/home/' + projectId);
                        break;
                }
            })
        } else {
            res.redirect('/');
        }

        //TODO type by id

    });

    app.get('/feed/sticker/:projectId', function (req, res) {

        let token = req.cookies.token;
        let projectId = req.params.projectId;

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
                    stickers: stickers,
                    projectId: projectId
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home');
            })
        } else {
            res.redirect('/');

        }
    });

    app.get('/feed/story/:projectId', function (req, res) {

        let token = req.cookies.token;
        let projectId = req.params.projectId;
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
                    artworks: combined,
                    projectId: projectId

                });


            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/');
            })
        } else {
            res.redirect('/');

        }
    });
};