let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let _ = require('underscore');
let type = require('../cloud/modules/type');
let multer = require('multer');
let fs = require('fs');

const PARSE_LIMIT = 2000;

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

module.exports = function (app) {

    app.get('/stories/:projectId', function (req, res) {

        let token = req.cookies.token;
        let projectId = req.params.projectId;

        if (token) {

            let _user = {};
            let art = {};
            let _story = [];
            let _allPack = [];
            let artWork = [];
            let _allArtwork = [];
            let _allProjects = [];
            let combined = [];
            let projectArray = [];
            let _latest = "";

            util.getUser(token).then(function (sessionToken) {

                projectArray.push(projectId);
                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Stories).equalTo("userId", _user.id).containedIn("projectIds", projectArray).descending("createdAt").find(),
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.ArtWork).find(),
                    new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                );


            }).then(function (story, allPack, artworks, latest, projects) {

                _story = story;
                _allPack = allPack;
                _allArtwork = artworks;
                _allProjects = projects;

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
                    projectItem: _allProjects,
                    arts: combined,
                    latest: _latest,
                    type: type
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home/' + projectId);
            })

        } else {
            res.redirect('/');

        }
    });

    app.get('/storyitem/:id/:projectId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let projectId = req.params.projectId;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.Stories).equalTo("objectId", id).first(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                )

            }).then(function (story, project) {

                res.render("pages/stories/story_catalogue", {

                    story_id: story.id,
                    name: story.get("title"),
                    projectItem: project

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

                let html = story_item.get("contents").html;
                for (let i = 0; i < html.length; i++) {
                    if (parseInt(indexValue) === i) {
                        let _html = html[i];
                        let typeOfObject = Object.keys(_html);
                        let content = Object.values(_html)[0];

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

    app.get('/storyItem/html/:state/:id/:projectId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let projectId = req.params.projectId;
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

                    return Parse.Promise.when(
                        new Parse.Query(_class.Stories).equalTo("objectId", id).first(),
                        new Parse.Query(_class.Projects).equalTo("objectId", projectId)
                    )

                } else if (state === "old") {

                    return Parse.Promise.when(
                        new Parse.Query(_class.Stories).equalTo("objectId", storyItem.get("storyId")).first(),
                        new Parse.Query(_class.Projects).equalTo("objectId", projectId)
                    )
                }

            }).then(function (story, project) {

                res.render("pages/stories/story_html", {
                    name: story.get("title"),
                    storyItemId: _story.id,
                    storyId: story.id,
                    projectItem: project
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/storyitem/" + id + '/' + projectId);
            })

        } else {

            res.redirect('/');
        }
    });

    app.get('/storyitem/view/:id/:projectId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let projectId = req.params.projectId;
        let sticker_array = [];
        let _storyItem;
        let _project;
        let _stickers = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.StoryItems).equalTo("storyId", id).find(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                )

            }).then(function (story_item, project) {

                _storyItem = story_item;
                _project = project;

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
                    projectItem: _project

                });
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/storyedit/' + id + '/' + projectId);
            })
        } else {
            res.redirect('/');
        }
    });

    app.post('/storyitem/html/change/:storyId', function (req, res) {
        let token = req.cookies.token;
        let story_id = req.params.storyId;
        let htmlContent = req.body.htmlContent;
        let newStoryItemType = req.body.newStoryItemType;
        let id = req.body.storyItemId;
        let index = parseInt(req.body.dataPosition);

        if (token) {
            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (story_item) {

                let contents = story_item.get("contents");

                let _html = contents.html[index];
                let htmlType = Object.keys(_html);

                if (parseInt(htmlType) !== type.STORY_ITEM.color) {

                    let html = {};
                    // html[htmlType.toString()] = {"text": htmlContent};
                    html[newStoryItemType] = {"text": htmlContent};

                    contents.html[index] = html;

                }

                story_item.set("contents", contents);
                return story_item.save();

            }).then(function () {

                res.redirect('/storyItem/html/edit/' + id + '/' + story_id);

            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/storyItem/html/edit/' + id + '/' + story_id);
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

                if (parseInt(htmlType) !== type.STORY_ITEM.color) {

                    let html = {};
                    html[htmlType.toString()] = {"text": htmlContent};

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

    app.post('/storyitem/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let content = req.body.content;
        let story_id = req.body.id;
        let heading = req.body.heading;
        let storyItemType = parseInt(req.body.type);
        let object = {};

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (story_item) {

                if (storyItemType === type.STORY_ITEM.text || storyItemType === type.STORY_ITEM.quote ||
                    storyItemType === type.STORY_ITEM.bold || storyItemType === type.STORY_ITEM.italic ||
                    storyItemType === type.STORY_ITEM.italicBold || storyItemType === type.STORY_ITEM.sideNote ||
                    storyItemType === type.STORY_ITEM.greyArea || type.STORY_ITEM.list) {

                    object = {"text": content};

                } else if (storyItemType === type.STORY_ITEM.heading) {

                    object = {"heading": heading, "text": content};

                }

                story_item.set("contents", object);
                return story_item.save();

            }).then(function () {

                res.redirect('/storyitem/view/' + story_id);

            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/storyitem/edit/' + id + "/" + story_id);
            })
        } else {
            res.redirect('/');
        }
    });

    app.post('/storyitem/sticker/:id', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.id;
        let projectId = req.body.projectId;

        if (token) {

            let _user = {};
            let _story = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

            }).then(function (story) {

                _story = story;

                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).limit(PARSE_LIMIT).find(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                )

            }).then(function (stickers, project) {

                res.render("pages/stories/catalogue_sticker", {
                    story: _story.id,
                    stickers: stickers,
                    projectItem: project
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/storyitem/' + id + '/' + projectId);

            });
        } else {
            res.redirect('/');

        }
    });

    app.post('/storyitem/sticker/add/:id', function (req, res) {

        let token = req.cookies.token;
        let sticker_id = req.body.sticker_id;
        let sticker_url = req.body.sticker_url;
        let story_id = req.params.id;

        if (token) {

            util.getUser(token).then(function (sessionToken) {
                let Story = new Parse.Object.extend(_class.StoryItems);
                let catalogue = new Story();

                catalogue.set("contents", {"id": sticker_id, "uri": sticker_url});
                catalogue.set("storyId", story_id);
                catalogue.set("type", type.STORY_ITEM.sticker);

                return catalogue.save();

            }).then(function () {

                res.redirect('/storyitem/' + story_id);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/storyedit/' + story_id);

            })
        } else {
            res.redirect('/');

        }
    });

    app.post('/storyItem/image/:id', upload.array('im1'), function (req, res) {

        let token = req.cookies.token;
        let files = req.files;
        let id = req.params.id;
        let projectId = req.body.projectId;
        let storyItem = "/storyitem/";

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                let Asset = new Parse.Object.extend(_class.Assets);
                let asset = new Asset();

                let fullName = files[0].originalname;
                let stickerName = fullName.substring(0, fullName.length - 4);

                let bitmap = fs.readFileSync(files[0].path, {encoding: 'base64'});

                //create our parse file
                let parseFile = new Parse.File(stickerName, {base64: bitmap}, files[0].mimetype);

                asset.set("uri", parseFile);

                return asset.save();

            }).then(function (image) {

                let Story = new Parse.Object.extend(_class.StoryItems);
                let catalogue = new Story();

                catalogue.set("type", type.STORY_ITEM.image);
                catalogue.set("contents", {"uri": image.get("uri").url(), "id": image.id});
                catalogue.set("storyId", id);

                return catalogue.save();

            }).then(function () {

                //Delete tmp fil after upload
                let tempFile = files[0].path;
                fs.unlink(tempFile, function (err) {
                    if (err) {
                        //TODO handle error code
                        console.log("-------Could not del temp" + JSON.stringify(err));
                    }
                    else {
                        console.log("SUUCCCEESSSSS IN DELTEING TEMP");
                    }
                });

                res.redirect(storyItem + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(storyItem + id + '/' + projectId);

            })
        } else {
            res.redirect('/');

        }
    });

    app.post('/storyItem/type/:id', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.id;
        let content = req.body.content;
        let heading = req.body.heading;
        let projectId = req.body.projectId;
        let _type = parseInt(req.body.style);

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                let Story = new Parse.Object.extend(_class.StoryItems);
                let story = new Story();

                switch (_type) {
                    case type.STORY_ITEM.text:
                        story.set("type", type.STORY_ITEM.text);
                        story.set("contents", {"text": content});
                        break;

                    case type.STORY_ITEM.quote:
                        story.set("type", type.STORY_ITEM.quote);
                        story.set("contents", {"text": content});
                        break;

                    case type.STORY_ITEM.divider:
                        story.set("type", type.STORY_ITEM.divider);
                        story.set("contents", {"": ""});
                        break;

                    case type.STORY_ITEM.italic:
                        story.set("type", type.STORY_ITEM.italic);
                        story.set("contents", {"text": content});
                        break;

                    case type.STORY_ITEM.bold:
                        story.set("type", type.STORY_ITEM.bold);
                        story.set("contents", {"text": content});
                        break;

                    case type.STORY_ITEM.italicBold:
                        story.set("type", type.STORY_ITEM.italicBold);
                        story.set("contents", {"text": content});
                        break;

                    case type.STORY_ITEM.list:
                        story.set("type", type.STORY_ITEM.list);
                        story.set("contents", {"text": content});
                        break;

                    case type.STORY_ITEM.sideNote:
                        story.set("type", type.STORY_ITEM.sideNote);
                        story.set("contents", {"text": content});
                        break;

                    case type.STORY_ITEM.greyArea:
                        story.set("type", type.STORY_ITEM.greyArea);
                        story.set("contents", {"text": content});
                        break;

                    case type.STORY_ITEM.heading:
                        story.set("type", type.STORY_ITEM.heading);
                        story.set("contents", {"heading": heading, "text": content});
                        break;
                }

                story.set("storyId", id);

                return story.save();

            }).then(function () {

                res.redirect("/storyitem/" + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/storyedit/" + id + '/' + projectId);
            })
        } else {
            res.redirect('/');

        }
    });

    app.post('/story/artwork/add/:id/:state', function (req, res) {

        let token = req.cookies.token;
        let story_id = req.params.id;
        let state = req.params.state;

        let sticker_id = req.body.sticker_id;
        let projectId = req.body.projectId;
        let storyEdit = '/storyedit/';

        if (token) {

            let _user = {};
            let id;

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Stories).equalTo("objectId", story_id).first();

            }).then(function (story) {
                id = story.id;

                if (state === "change") {

                    return new Parse.Query(_class.ArtWork).equalTo("itemId", story.id).first();

                } else if (state === "new") {

                    let Artwork = new Parse.Object.extend(_class.ArtWork);
                    let artwork = new Artwork();

                    artwork.set("itemId", id);
                    artwork.set("stickerId", sticker_id);

                    return artwork.save();
                }


            }).then(function (artwork) {

                if (state === "change") {

                    artwork.set("stickerId", sticker_id);

                    return artwork.save();

                } else if (state === "new") {
                    res.redirect(storyEdit + id + '/' + projectId);

                }

            }).then(function () {

                res.redirect(storyEdit + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(storyEdit + story_id + '/' + projectId);

            });
        } else {
            res.redirect('/');

        }
    });

    app.get('/story/artwork/:state/:storyId/:projectId', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.storyId;
        let projectId = req.params.projectId;
        let state = req.params.state;

        if (token) {

            let _user = {};
            let _story = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

            }).then(function (story) {

                _story = story;

                return new Parse.Query(_class.Stickers).limit(PARSE_LIMIT).find();

            }).then(function (stickers) {

                res.render("pages/stories/story_artwork", {
                    story: _story.id,
                    stickers: stickers,
                    state: state,
                    projectId: projectId
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/storyedit/' + id + '/' + projectId);

            });
        } else {
            res.redirect('/');

        }
    });

    app.get('/storyedit/:storyId/:projectId', function (req, res) {

        let token = req.cookies.token;
        let story_id = req.params.storyId;
        let projectId = req.params.projectId;
        let _latest = "";
        let page;

        if (token) {

            let _user = {};
            let _story = {};
            let colors = [];
            let _authors = [];
            let art;
            let authorName;
            let authorId;


            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Stories).equalTo("objectId", story_id).first(),
                    new Parse.Query(_class.ArtWork).equalTo("itemId", story_id).first(),
                    new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first(),
                    new Parse.Query(_class.Stories).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.Authors).find()
                );

            }).then(function (story, sticker, latest, stories, authors) {

                _story = story;
                _authors = authors;

                if (latest) {
                    _latest = latest;
                }

                page = util.page(stories, story_id);

                colors = story.get("color");

                if (colors.topColor === "" || colors === {}) {
                    //use system default
                    colors = type.DEFAULT.colors;

                } else {
                    colors = story.get("color");

                }

                if (sticker) {

                    return new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first();

                } else {
                    return "";
                }


            }).then(function (_sticker) {

                art = _sticker;

                console.log("STORY INFO " + _story.get("authorId"));
                if (_story.get("authorId") === "") {

                    return "";

                } else {

                    return new Parse.Query(_class.Authors).equalTo("objectId", _story.get("authorId")).first();

                }

            }).then(function (author) {
                if (author === "") {
                    authorName = "";
                    authorId = "";
                } else {
                    authorName = author.get("name");
                    authorId = author.id;
                }


                return Parse.Promise.when(
                    new Parse.Query(_class.Projects).containedIn("objectId", _story.get("projectIds")).find(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                )

            }).then(function (projects, project) {

                console.log("PROJECTS  " + JSON.stringify(projects));

                res.render("pages/stories/story_details", {
                    story: _story,
                    sticker: art,
                    colors: colors,
                    latest: _latest,
                    authors: _authors,
                    author: authorName,
                    authorId: authorId,
                    projects: projects,
                    projectItem: project,
                    next: page.next,
                    previous: page.previous
                });

            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/stories');
            })

        } else {

            res.redirect('/');

        }
    });

    app.post('/storyedit/:id', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.id;
        let title = req.body.title;
        let keyword = req.body.keyword;
        let summary = req.body.summary;
        let authorId = req.body.authorId;
        let projectId = req.body.projectId;
        let _keyword = [];
        let storyEdit = '/storyedit/';

        console.log("KEYWORD " + keyword);
        if (keyword !== "undefined" || keyword !== undefined) {
            _keyword = keyword.split(",");
        }

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {
                _user = sessionToken.get("user");

                return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

            }).then(function (story) {

                story.set("title", title);
                story.set("keywords", _keyword);
                story.set("summary", summary);
                story.set("authorId", authorId);

                return story.save();

            }).then(function () {

                res.redirect(storyEdit + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(storyEdit + id + '/' + projectId);

            })
        } else {
            res.redirect('/');

        }
    });

    app.post('/story', function (req, res) {
        let token = req.cookies.token;
        let title = req.body.title;
        let summary = req.body.summary;
        let pack_id = req.body.pack_id;
        let projectId = req.body.projectId;
        let body = req.body.summary;
        let storyType = parseInt(req.body.storyType);
        let projectArray = [];

        projectArray.push(projectId);

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                let Stories = new Parse.Object.extend(_class.Stories);
                let story = new Stories();

                story.set("title", title);
                story.set("summary", summary);
                story.set("packId", pack_id);
                story.set("keywords", []);
                // story.set("is_latest_story", false);
                story.set("published", false);
                story.set("projectIds", projectArray);
                story.set("userId", _user.id);
                story.set("status", 0);
                story.set("storyType", storyType);
                story.set("authorId", "");
                story.set("color", {topColor: "", bottomColor: ""});

                return story.save();

            }).then(function (story) {
                //     let Main = new Parse.Object.extend(_class.StoryBody);
                //     let main = new Main();
                //
                //     story_id = story.id;
                //     main.set("storyId", story.id);
                //     main.set("story", body);
                //
                //     return main.save();
                //
                // }).then(function (main) {

                res.redirect('/story/artwork/new/' + story.id + '/' + projectId);

            }, function (error) {
                console.log("ERROR WHEN CREATING NEW STORY " + error.message);
                res.redirect('/stories');
            });
        } else {
            res.redirect('/');
        }

    });

    app.get('/storycolor/:storyId/:projectId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.storyId;
        let projectId = req.params.projectId;
        let color = [];
        let _story = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.Stories).equalTo("objectId", id).first(),
                    new Parse.Query(_class.ArtWork).equalTo("itemId", id).first()
                );

            }).then(function (story, art) {

                _story = story;
                colors = story.get("color");

                if (colors.topColor === "" || colors === {}) {
                    //use system default
                    colors = type.DEFAULT.colors
                } else {
                    color = story.get("color");

                }
                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", art.get("stickerId")).first(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                )
            }).then(function (sticker, project) {

                res.render("pages/stories/choose_color", {
                    story: _story,
                    colors: colors,
                    sticker: sticker,
                    projectItem: project
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/storyedit/' + story.id);
            })

        } else {
            res.redirect('/');

        }
    });

    app.post('/story/color/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let color_1 = req.body.top;
        let color_2 = req.body.bottom;
        let projectId = req.body.projectId;
        let storyEdit = '/storyedit/';

        console.log("COLOR FROM " + color_1 + " " + color_2);

        if (token) {
            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

            }).then(function (story) {

                story.set("color", {"topColor": color_1, "bottomColor": color_2});

                return story.save();

            }).then(function () {

                res.redirect(storyEdit + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(storyEdit + id + '/' + projectId);

            });

        } else {
            res.redirect('/');

        }
    });

    app.get('/storymain/:id', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.id;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.StoryBody).equalTo("storyId", id).first(),
                    new Parse.Query(_class.Stories).equalTo("objectId", id).first()
                )

            }).then(function (storyBody, story) {

                res.render("pages/stories/story_page", {
                    story: storyBody,
                    title: story.get("title")
                });

            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/storyedit/' + id);
            });
        } else {
            res.redirect('/');

        }
    });

    app.post('/storymain/edit/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let main_story = req.body.main_story;
        let story_id = "";
        let storyMain = '/storymain/';

        if (token) {
            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.StoryBody).equalTo("objectId", id).first();
            }).then(function (story) {

                story_id = story.get("storyId");

                story.set("story", main_story);

                return story.save();

            }).then(function () {

                res.redirect(storyMain + story_id);

            }, function (error) {

                console.log("ERROR " + error.message)
                res.redirect(storyMain + story_id);
            })
        } else {
            res.redirect('/');

        }
    });

    app.get('/storydelete/:id/:projectId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let projectId = req.params.projectId;
        let _user = {};

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

            }).then(function (story) {

                story.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        res.redirect('/stories/' + projectId);
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                        res.redirect("/stories/" + projectId);

                    }
                });

            }, function (error) {

                console.log("ERROR " + error);
                res.redirect("/stories/" + projectId);

            })
        } else {
            res.redirect('/');
        }
    });

    app.post('/storyitem/delete/:storyId', function (req, res) {
        let token = req.cookies.token;
        let id = req.body.storyItem;
        let storyId = req.params.storyId;
        let projectId = req.body.projectId;
        let storyItemView = "/storyitem/view/";
        let assetId;
        let _storyItem;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (storyItem) {

                assetId = storyItem.get("contents");
                _storyItem = storyItem;

                storyItem.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        return true;
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                        res.redirect(storyItemView + storyId + '/' + projectId);

                    }
                })

            }).then(function () {

                if (_storyItem.get("type") === type.STORY_ITEM.image) {

                    return new Parse.Query(_class.Assets).equalTo("objectId", assetId.uri).first();

                } else {

                    res.redirect(storyItemView + storyId + '/' + projectId);

                }

            }).then(function (asset) {

                asset.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        res.redirect(storyItemView + storyId + '/' + projectId);
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                        res.redirect(storyItemView + storyId + '/' + projectId);

                    }
                })

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/stories/' + projectId);
            })

        } else {
            res.redirect('/');
        }

    });

    app.get('/storyitem/delete/:id/:projectId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let projectId = req.params.projectId;
        let assetArray = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("storyId", id).find();

            }).then(function (stories) {

                if (stories.length > 0) {

                    _.each(stories, function (items) {

                        if (items.get("type") === type.STORY_ITEM.image) {
                            assetArray.push(items.get("contents").id);
                        }
                    });

                    return Parse.Object.destroyAll(stories);

                } else {

                    return true;

                }

            }).then(function (success) {

                if (assetArray.length > 0) {

                    return new Parse.Query(_class.Assets).containedIn("objectId", assetArray).find();

                } else {

                    res.redirect("/storydelete/" + id + '/' + projectId);

                }

            }).then(function (assets) {

                if (assets) {

                    return Parse.Object.destroyAll(assets);

                } else {

                    res.redirect("/storydelete/" + id + '/' + projectId);

                }

            }).then(function () {

                res.redirect("/storydelete/" + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/stories/' + projectId);
            })

        } else {
            res.redirect('/');
        }
    });

    app.post('/storyitem/change/:storyId', upload.array('im1'), function (req, res) {

        let token = req.cookies.token;
        let files = req.files;
        let id = req.body.storyItemId;
        let storyId = req.params.storyId;
        let previousForm = parseInt(req.body.previousContent);
        let storyItemType = parseInt(req.body.storyItemType);
        let content = req.body.text_element;
        let _storyItem = [];
        let storyContent;
        let _storyId;
        let storyItemView = '/storyitem/view/';

        console.log("TYPE " + storyItemType);

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (storyItem) {

                _storyItem = storyItem;
                storyContent = storyItem.get("contents");
                _storyId = storyItem.get("storyId");

                if (storyItemType === type.STORY_ITEM.text || storyItemType === type.STORY_ITEM.quote ||
                    storyItemType === type.STORY_ITEM.bold || storyItemType === type.STORY_ITEM.italic ||
                    storyItemType === type.STORY_ITEM.italicBold) {

                    storyItem.set("type", storyItemType);
                    storyItem.set("contents", {"text": content});

                    return storyItem.save();
                } else if (storyItemType === type.STORY_ITEM.divider) {

                    storyItem.set("type", storyItemType);
                    storyItem.set("contents", {"": ""});

                    return storyItem.save();
                } else if (storyItemType === type.STORY_ITEM.image) {

                    if (files) {
                        let Asset = new Parse.Object.extend(_class.Assets);
                        let asset = new Asset();

                        let fullName = files[0].originalname;
                        let stickerName = fullName.substring(0, fullName.length - 4);

                        let bitmap = fs.readFileSync(files[0].path, {encoding: 'base64'});

                        let parseFile = new Parse.File(stickerName, {base64: bitmap}, files[0].mimetype);

                        asset.set("uri", parseFile);

                        return asset.save();
                    }
                } else if (storyItemType === type.STORY_ITEM.sticker) {
                    res.redirect('/storyitem/change/sticker/' + _storyId + '/' + id);
                }
            }).then(function (asset) {

                if (storyItemType === type.STORY_ITEM.image) {
                    _storyItem.set("type", storyItemType);
                    _storyItem.set("contents", {"uri": asset.get("uri").url(), "id": asset.id});

                    return _storyItem.save();

                } else {

                    return true;

                }
            }).then(function () {

                if (files.length > 0) {
                    let tempFile = files[0].path;
                    fs.unlink(tempFile, function (err) {
                        if (err) {
                            //TODO handle error code
                            console.log("-------Could not del temp" + JSON.stringify(err));
                        }
                        else {
                            console.log("SUUCCCEESSSSS IN DELTEING TEMP");
                        }
                    });
                }

                if (previousForm === type.STORY_ITEM.image) {

                    console.log("INSIDE IMAGE" + storyContent + " STORY " + _storyItem.get("contents").uri);
                    return new Parse.Query(_class.Assets).equalTo("objectId", storyContent).first();

                } else {
                    res.redirect(storyItemView + storyId);

                }

            }).then(function (image) {

                console.log("IMAGE FROM ASSETS " + JSON.stringify(image));


                image.destroy({
                    success: function (object) {
                        console.log("DESTROYED IAMGE " + JSON.stringify(object));
                        res.redirect(storyItemView + storyId);
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                        res.redirect(storyItemView + storyId);

                    }
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(storyItemView + storyId);

            })

        } else {
            res.redirect('/');
        }

    });

    app.post('/storyitem/change/sticker/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let stickerId = req.body.sticker_id;
        let sticker_url = req.body.sticker_url;
        let storyId;
        let storyItemView = '/storyitem/view/';

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                console.log(" STORYITEM 2 " + id);

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (storyItem) {

                console.log("STORY ITEM " + JSON.stringify(storyItem));

                storyId = storyItem.get("storyId");

                storyItem.set("type", type.STORY_ITEM.sticker);
                storyItem.set("contents", {"id": stickerId, "uri": sticker_url});

                return storyItem.save();

            }).then(function () {

                res.redirect(storyItemView + storyId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(storyItemView + storyId);

            })
        } else {
            res.redirect('/');
        }

    });

    app.get('/storyitem/change/sticker/:storyId/:storyItemId', function (req, res) {

        let token = req.cookies.token;
        let storyId = req.params.storyId;
        let storyItemId = req.params.storyItemId;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                console.log("STORY ID " + storyId + " STORYITEM " + storyItemId);

                return new Parse.Query(_class.Stickers).limit(PARSE_LIMIT).find();
                // return new Parse.Query(_class.Stories).equalTo("objectId", storyId).first();
                //
                // }).then(function (story) {
                //
                //     return new Parse.Query(_class.Packs).equalTo("objectId", story.get("packId")).first();
                //
                // }).then(function (pack) {
                //
                //     let col = pack.relation(_class.Packs);
                //     return col.query().find();

            }).then(function (stickers) {

                res.render("pages/stories/change_catalogue_sticker", {
                    storyItemId: storyItemId,
                    stickers: stickers
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/storyitem/view/' + storyId);
            })

        } else {

            res.redirect('/');

        }
    });

    app.get('/storyitem/edit/:id/:story_id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let story_id = req.params.story_id;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }).then(function (story_item) {

                res.render("pages/stories/edit_story_item", {
                    story_item: story_item,
                    story_id: story_id
                })

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/story/item/' + story_id);

            })
        } else {
            res.redirect('/');
        }

    });
};