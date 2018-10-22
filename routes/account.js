let helper = require('../cloud/modules/helpers');
let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let fs = require('fs');

const NORMAL_USER = 2;
const SUPER_USER = 0;
const MK_TEAM = 1;

let errorMessage = "";
const PARSE_SERVER_URL = process.env.SERVER_URL;

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

    app.get('/home', function (req, res) {
        let token = req.cookies.token;

        if (token){

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Projects).equalTo("userId", _user.id).find();

            }).then(function (projects) {

                res.render("pages/dashboard/landing", {
                    projects: projects,
                    user_name: _user.get("name"),
                    verified: _user.get("emailVerified"),
                    error_message: "null",
                    projectLength: helper.leadingZero(projects.length)
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/');
            })

        }else {
            res.redirect('/');
        }
    });

    app.get('/home/:projectId', function (req, res) {

        let token = req.cookies.token;
        let projectId = req.params.projectId;

        if (token) {

            let _user = {};

            let _allPacks = [];
            let _story = [];
            let _collection = [];
            let _allAds = [];
            let _categories = [];
            let _messages = [];
            let _allProducts = [];
            let _allProjects = [];
            let stickerId;
            let _latestSticker = "";
            let _projectItem = "";
            let _storyBody;
            let _stickerName;
            let _categoryLength = 0;
            let _packLength = 0;
            let _stickerLength = 0;
            let _storyLength = 0;
            let _projectLength = 0;
            let projectArray = [];
            const limit = 5;

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");
                projectArray.push(projectId);
                if (_user.get("type") === MK_TEAM) {
                    res.redirect('/barcodes');
                }

                return Parse.Promise.when(
                    new Parse.Query(_class.Latest).equalTo("projectId", projectId).equalTo("userId", _user.id).equalTo("type", type.FEED_TYPE.sticker).first(),
                    new Parse.Query(_class.Latest).equalTo("projectId", projectId).equalTo("userId", _user.id).equalTo("type", type.FEED_TYPE.story).first(),
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).containedIn("projectIds", projectArray).descending("createdAt").limit(limit).find(),
                    new Parse.Query(_class.Categories).limit(limit).find(),
                    new Parse.Query(_class.Stories).equalTo("userId", _user.id).containedIn("projectIds", projectArray).descending("createdAt").limit(limit).find(),
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).containedIn("projectIds", projectArray).find(),
                    new Parse.Query(_class.Categories).count(),
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).containedIn("projectIds", projectArray).count(),
                    new Parse.Query(_class.Stickers).equalTo("userId", _user.id).count(),
                    new Parse.Query(_class.Stories).equalTo("userId", _user.id).containedIn("projectIds", projectArray).count(),
                    new Parse.Query(_class.Adverts).equalTo("userId", _user.id).containedIn("projectIds", projectArray).limit(limit).find(),
                    new Parse.Query(_class.Message).limit(limit).find(),
                    new Parse.Query(_class.Product).limit(limit).find(),
                    new Parse.Query(_class.Projects).limit(limit).find(),
                    new Parse.Query(_class.Projects).equalTo("userId", _user.id).count(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()

                );

            }).then(function (sticker, latestStory, collection, categories, story, allPacks, categoryLength, packLength,
                              stickerLength, storyLength, allAdverts, allMessages, products, projects, projectLength, projectItem) {

                _categories = categories;
                _collection = collection;
                _story = story;
                _messages = allMessages;
                _allPacks = allPacks;
                _allAds = allAdverts;
                _allProducts = products;
                _allProjects = projects;
                _projectItem = projectItem;
                _categoryLength = helper.leadingZero(categoryLength);
                _packLength = helper.leadingZero(packLength);
                _stickerLength = helper.leadingZero(stickerLength);
                _storyLength = helper.leadingZero(storyLength);
                _projectLength = helper.leadingZero(projectLength);

                if (latestStory && sticker){
                    return Parse.Promise.when(
                        new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first(),
                        new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first(),
                        new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first()
                    );
                }else if (latestStory && sticker === undefined){
                    return Parse.Promise.when(
                        undefined,
                        new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first(),
                        new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first()
                    );
                }else if (sticker && latestStory === undefined){
                    return Parse.Promise.when(
                        new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first(),
                        undefined,
                        undefined
                    );
                }else {
                    return Parse.Promise.when(
                        undefined,
                        undefined,
                        undefined
                    );
                }


            }).then(function (latestSticker, storyImage, storyBody) {

                if (latestSticker !== undefined){
                    _latestSticker = latestSticker.get("uri");
                    _latestSticker['stickerName'] = latestSticker.get("name");
                    _latestSticker['description'] = latestSticker.get("description");
                }

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
                        allProjects: _allProjects,
                        projectItem: _projectItem,
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
                        projectLength: _projectLength,
                        projectId: projectId,
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

    app.get('/account/create', function (req, res) {
        let message = "";
        res.render("pages/accounts/sign_up", {error: message});
    });

    app.post('/account/user/update', upload.array('im1'), function (req, res) {

        let token = req.cookies.token;
        let email = req.body.email;
        let image = req.files;
        let type = parseInt(req.body.type);
        let handle = req.body.handles;
        let profile_info = [];
        let link_length = [];
        let accountRedirect = '/account/user/profile';

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Profile).equalTo("userId", _user.id).first();

            }).then(function (profile) {

                if (image) {
                    image.forEach(function (file) {

                        console.log("FILE INFO " + file.path);

                        let fullName = file.originalname;

                        let image_name = fullName.substring(0, fullName.length - 4);

                        let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                        //create our parse file
                        let parseFile = new Parse.File(image_name, {base64: bitmap}, file.mimetype);

                        profile.set("uri", parseFile);
                        profile.set("email", email);
                        // sticker.setACL(setPermission(_user, false));

                        profile_info.push(profile);
                    });
                } else {

                    profile.set("email", email);
                    return profile.save()

                }

                return Parse.Object.saveAll(profile_info);

            }).then(function (saved_profile) {

                if (profile_info.length) {
                    _.each(profile_info, function (file) {
                        //Delete tmp fil after upload
                        let tempFile = file.path;
                        fs.unlink(tempFile, function (err) {
                            if (err) {
                                //TODO handle error code
                                console.log("-------Could not del temp" + JSON.stringify(err));
                            }
                            else {
                                console.log("SUUCCCEESSSSS IN DELTEING TEMP");
                            }
                        });
                    });
                }
                return new Parse.Query(_class.Links).equalTo("itemId", _user.id).find();

            }).then(function (links) {

                if (type && handle) {
                    if (links.length !== 0) {
                        _.each(links, function (_link) {

                            if (_link.get("type") === type) {

                                _link.set("link", handle);
                                link_length.push(1);

                                return _link.save();
                            }

                        });

                        if (link_length.length === 0) {

                            let Link = new Parse.Object.extend(_class.Links);
                            let link = new Link();

                            link.set("itemId", _user.id);
                            link.set("type", type);
                            link.set("link", handle);

                            return link.save();

                        }

                    } else {
                        let Link = new Parse.Object.extend(_class.Links);
                        let link = new Link();

                        link.set("itemId", _user.id);
                        link.set("type", type);
                        link.set("link", handle);

                        return link.save();
                    }


                } else {

                    console.log("TYPE AND HANDLE NOT PRESENT");
                    res.redirect(accountRedirect);

                }

            }).then(function () {

                res.redirect(accountRedirect);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(accountRedirect);

            })
        } else {
            res.redirect('/');
        }
    });

    app.post('/signup', function (req, res) {
        let name = req.body.name;
        let username = req.body.username;
        let password = req.body.password;
        let gender = req.body.gender;

        let user = new Parse.User();
        user.set("name", name);
        user.set("username", username);
        user.set("password", password);
        user.set("type", NORMAL_USER);
        user.set("image_set", false);

        let Profile = new Parse.Object.extend(_class.Profile);
        let profile = new Profile();

        user.signUp({useMasterKey: true}, {
            success: function (user) {

                profile.set("userId", user.id);
                profile.set("email", username);
                if (gender !== "undefined" || gender !== undefined) {
                    profile.set("gender", gender);
                } else {
                    profile.set("gender", "null");
                }

                profile.save().then(function () {

                    res.redirect('/');

                });


            },
            error: function (user, error) {
                // Show the error message somewhere and let the user try again.
                let message = "SignUp was unsuccessful. " + error.message;
                console.log("SignUp was unsuccessful. " + JSON.stringify(error));
                res.render("pages/accounts/sign_up", {error: message});
            }
        });


    });

    app.get('/account/password/forgot', function (req, res) {
        res.render("pages/accounts/forgot_password");
    });

    app.post('/account/password/reset', function (req, res) {
        const username = req.body.forgotten_password;

        Parse.User.requestPasswordReset(username, {
            success: function () {
                // Password reset request was sent successfully
                console.log("EMAIL was sent successfully");
                res.render("pages/accounts/password_reset_info");
            },
            error: function (error) {
                // Show the error message somewhere
                console.log("Error: " + error.code + " " + error.message);
                res.redirect('/account/password/forgot');
            }
        });
    });

    app.get('/account/email/reset', function (req, res) {
        const token = req.cookies.token;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                new Parse.Query("User").equalTo("objectId", _user.id).first().then(function (user) {
                    console.log("USER FROM RESET " + JSON.stringify(user) + " CURRENT USER " + Parse.User.current());
                    user.set("email", "test@gmail.com");
                    // user.set("username", "test@gmail.com");
                    return user.save();
                }).then(function (result) {
                    console.log("EMAIL CHANGED SUCCESSFULLY " + JSON.stringify(result));
                    res.redirect("/");
                })
            }, function (error) {
                console.log("ERROR OCCURRED WHEN RESETTING EMAIL " + error.message)
            });

        } else {
            res.redirect('/');

        }

    });

    app.get('/account/user/profile', function (req, res) {

        let token = req.cookies.token;
        let _user = {};
        let _profile = {};

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Profile).equalTo("userId", _user.id).first();

            }).then(function (profile) {

                _profile = profile;

                return new Parse.Query(_class.Links).equalTo("itemId", profile.get("userId")).find();

            }).then(function (links) {

                res.render("pages/accounts/profile", {
                    username: _user.get("name"),
                    email: _user.get("username"),
                    profile: _profile,
                    links: links
                });

            }, function (error) {
                console.log("ERROR ON PROFILE " + error.message);
                res.redirect('/');
            });

        } else {
            res.redirect('/');
        }
    });

    app.get('/account/logout', function (req, res) {
        res.clearCookie('token');
        res.redirect("/");
    });


};