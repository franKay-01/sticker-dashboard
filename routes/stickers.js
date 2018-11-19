let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let _ = require('underscore');
let type = require('../cloud/modules/type');
let multer = require('multer');
let fs = require('fs');
let download = require('image-downloader');

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

    app.get('/uploads/computer/:id/:projectId', function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.params.id;
        let projectId = req.params.projectId;

        if (token) {
            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

            }).then(function (pack) {

                res.render("pages/stickers/add_sticker", {
                    id: pack.id,
                    pack_name: pack.get("name"),
                    projectId: projectId
                });

            }, function (error) {
                res.redirect("/");

            })
        } else {
            res.redirect("/");
        }
    });

    app.post('/uploads/computer', upload.array('im1[]'), function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.body.pack_id;
        let projectId = req.body.projectId;
        let files = req.files;
        let fileDetails = [];
        let stickerDetails = [];
        let stickerCollection = {};
        let _previews = [];
        let pack = "/pack/";

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");
                //TODO implement DRY for thumbnails
                util.thumbnail(files).then(previews => {

                    _previews = previews;

                    return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first({sessionToken: token});

                }).then(function (pack) {

                    stickerCollection = pack;

                    files.forEach(function (file) {

                        let Sticker = new Parse.Object.extend(_class.Stickers);
                        let sticker = new Sticker();


                        // fullName = fullName.replace(util.SPECIAL_CHARACTERS, '');
                        let originalName = file.originalname;
                        let stickerName = originalName.replace(util.SPECIAL_CHARACTERS, " ").substring(0, originalName.length - 4);

                        let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                        let bitmapPreview;
                        let parseFilePreview = "";

                        _.map(_previews, preview => {
                            if (stickerName === preview.name) {
                                bitmapPreview = fs.readFileSync(preview.path, {encoding: 'base64'});
                                parseFilePreview = new Parse.File(stickerName, {base64: bitmapPreview}, preview.mimetype);
                            }
                        });


                        //create our parse file
                        let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                        sticker.set("name", stickerName);
                        sticker.set("localName", stickerName);
                        sticker.set("uri", parseFile);
                        sticker.set("preview", parseFilePreview);
                        sticker.set("userId", _user.id);
                        sticker.set("parent", pack);
                        sticker.set("description", "");
                        sticker.set("meaning", "");
                        sticker.set("categories", []);
                        sticker.set("flagged", false);
                        sticker.set("archived", false);
                        if (pack.get("productId") !== "") {
                            sticker.set("sold", true);
                            sticker.set("productId", pack.get("productId"));
                        } else {
                            sticker.set("sold", false);
                            sticker.set("productId", "free");
                        }
                        sticker.set("version", pack.get("version"));

                        // sticker.setACL(setPermission(_user, false));

                        stickerDetails.push(sticker);
                        fileDetails.push(file);

                    });

                    console.log("SAVE ALL OBJECTS AND FILE");
                    return Parse.Object.saveAll(stickerDetails);

                }).then(function (stickers) {

                    _.each(fileDetails, function (file) {
                        //Delete tmp fil after upload
                        let tempFile = file.path;
                        fs.unlink(tempFile, function (err) {
                            if (err) {
                                //TODO handle error code
                                console.log("-------Could not del temp" + JSON.stringify(err));
                            }
                            else {
                                console.log("SUUCCCEESSSSS IN DELETING TEMP");
                            }
                        });
                    });

                    return new Parse.Query(_class.Stickers).equalTo("parent", {
                        __type: 'Pointer',
                        className: _class.Packs,
                        objectId: pack_id
                    }).find();


                    //console.log("SAVE COLLECTION RELATION");


                }).then(function (stickers) {

                    // res.send("STICKERS " + stickers.length);

                    _.each(stickers, function (sticker) {

                        let collection_relation = stickerCollection.relation(_class.Packs);
                        collection_relation.add(sticker);

                    });

                    // EMAIL PART

                    // let data = {
                    //     //Specify email data
                    //     from: process.env.EMAIL_FROM || "test@example.com",
                    //     //The email to contact
                    //     to: _user.get("username"),
                    //     //Subject and text data
                    //     subject: 'Stickers Uploaded',
                    //     html: fs.readFileSync("./uploads/sticker_upload.html", "utf8")
                    // };
                    //
                    // mailgun.messages().send(data, function (error, body) {
                    //     if (error) {
                    //         console.log("BIG BIG ERROR: " + error.message);
                    //     }
                    //     else {
                    //
                    //         console.log("EMAIL SENT" + body);
                    //     }
                    // });

                    return stickerCollection.save();

                }).then(function (stickers) {

                    res.redirect(pack + pack_id + '/' + projectId);

                }, function (error) {

                    console.log("BIG BIG ERROR" + error.message);
                    res.redirect(pack + pack_id + '/' + projectId);

                })
            }, function (error) {
                console.log("BIG BIG ERROR" + error.message);
                res.redirect("/");
            });


        } else {

            res.redirect("/");

        }
    });

    app.post('/sticker/review/:id/:pid', upload.array('im1'), function (req, res) {
        let token = req.cookies.token;
        let id = req.params.id;
        let pid = req.params.pid;
        let name = req.body.sticker_name;
        let category = req.body.category;
        let categories = req.body.categories;
        let review_id = req.body.review_id;
        let files = req.files;
        let _category = [];
        let category_names;
        let _category_names;

        if (token) {
            let _user = {};

            if (category !== undefined) {
                category_names = Array.from(category);
                _category = category_names;
            }

            if (categories !== undefined) {

                _category_names = Array.from(categories);

                if (_category.length !== 0) {
                    _category = _category.concat(_category_names);
                } else {
                    _category = _category_names;
                }
            }

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();

            }).then(function (sticker) {

                files.forEach(function (file) {

                    let fullName = file.originalname;
                    let stickerName = fullName.substring(0, fullName.length - 4);

                    let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                    //create our parse file
                    let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);

                    sticker.set("uri", parseFile);

                });

                sticker.set("name", name);
                sticker.set("categories", _category);

                return sticker.save();

            }).then(function (result) {

                _.each(files, function (file) {
                    //Delete tmp fil after upload
                    let tempFile = file.path;
                    fs.unlink(tempFile, function (error) {
                        if (error) {
                            //TODO handle error code
                            //TODO add job to do deletion of tempFiles
                            console.log("-------Could not del temp" + JSON.stringify(error));
                        }
                        else {
                            console.log("-------Deleted All Files");

                        }
                    });
                });

                res.redirect('/pack/' + pid);
            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/review/edit/' + review_id);
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/sticker/edit/:stickerId/:packId/:projectId', function (req, res) {

        let token = req.cookies.token;
        let stickerId = req.params.stickerId;
        let packId = req.params.packId;
        let projectId = req.params.projectId;
        // let stickers = req.params.stickers;
        let _sticker;
        let _categories;
        let selectedCategories;
        let _pack = [];
        let _latest = "";
        let _page;
        let _project;

        if (token) {
            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first(),
                    new Parse.Query(_class.Categories).ascending("name").find(),
                    new Parse.Query(_class.Packs).equalTo("objectId", packId).first(),
                    new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                );

            }).then(function (sticker, categories, pack, latest, project) {

                _sticker = sticker;
                _categories = categories;
                _pack = pack;
                _project = project;

                if (latest) {
                    _latest = latest;
                }

                selectedCategories = sticker.get("categories");

                let sticker_relation = sticker.relation(_class.Categories);
                return sticker_relation.query().find();

            }).then(function (stickerCategories) {

                // var categoryNames = [];
                // _.each(stickerCategories, function (category) {
                //     categoryNames.push(category.get("name"))
                // });

                // console.log("CATEGORY NAMES " + categoryNames);

                // if (_user.get("type") === SUPER_USER) {
                //     res.render("pages/reviews/admin_details", {
                //         sticker: stickerDetail,
                //         // categoryNames: categoryNames.sort(),
                //         categories: allCategories,
                //         pack_id: pack_
                //     });
                // } else {


                //TODO how to catch error when time expires (Check APIs)
                // const AWS = require('aws-sdk');
                //
                // const s3 = new AWS.S3();
                // AWS.config.update({
                //     accessKeyId: 'AKIAINM7RXYLJVMDEMLQ',
                //     secretAccessKey: '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'
                // });

                // const s3 = new AWS.S3();
                //
                // AWS.config.region = 'us-east-1'; // Region
                // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                //     IdentityPoolId: 'us-east-1:3040d86e-7139-4023-b6d6-d84b37b220e6',
                // });
                //
                // const myBucket = 'cyfa';
                // let name = _sticker.get("uri").name();
                //
                // console.log("NAME " + name);
                //
                // const key = name;
                // const signedUrlExpireSeconds = 60 * 5;
                //
                // s3.getSignedUrl('getObject', {
                //     Bucket: myBucket,
                //     Key: key,
                //     Expires: signedUrlExpireSeconds
                // }, function (error, url) {
                //     if (error){
                //         console.log("ERROR S3", error.message);
                //
                //     }else {
                //         // res.redirect(url);
                //         console.log("The URL is", url);
                //
                //     }
                // });

                let col = _pack.relation(_class.Packs);
                return col.query().find({sessionToken: token});

            }).then(function (stickers) {

                _page = util.page(stickers, stickerId);

                res.render("pages/stickers/sticker_details", {
                    sticker: _sticker,
                    selected: selectedCategories,
                    categories: _categories,
                    pack_id: packId,
                    next: _page.next,
                    previous: _page.previous,
                    // uri: url,
                    id: stickerId,
                    latest: _latest,
                    projectItem: _project
                });
            }, function (error) {
                console.log("Error Loading-----------------------" + error.messgae);
                res.redirect("/pack/" + packId);

            });
        }
        else {
            res.redirect("/");
        }
    });

    app.post('/sticker/edit/:stickerId/:packId', function (req, res) {

        let token = req.cookies.token;

        //input fields from form
        let stickerName = req.body.stickerName;
        // let localName = req.body.localName;
        let new_categories = req.body.categories;
        let stickerId = req.params.stickerId;
        let packId = req.params.packId;
        let sticker_status = req.body.sticker_status;
        let meaning = req.body.meaning;
        let description = req.body.description;
        let stickerEdit = "/sticker/edit/";

        let _listee = [];

        if (new_categories) {

            if (new_categories !== undefined) {
                let category_new = Array.from(new_categories);

                _.each(category_new, function (category) {
                    _listee.push(category);
                });
            }
        }

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

            }).then(function (sticker) {

                sticker.set("name", stickerName);
                sticker.set("localName", stickerName);
                sticker.set("categories", _listee);
                sticker.set("meaning", meaning);
                if (sticker_status === "1") {
                    sticker.set("sold", true);
                } else if (sticker_status === "0") {
                    sticker.set("sold", false);
                }
                sticker.set("description", description);

                return sticker.save();

            }).then(function (sticker) {

                console.log("STICKER UPDATED" + JSON.stringify(sticker));
                res.redirect(stickerEdit + stickerId + "/" + packId);

            }, function (error) {

                console.log("SERVER ERROR " + error.message);
                res.redirect(stickerEdit + stickerId + "/" + packId);

            });

        } else {

            console.log("No session found[[[[[[");
            res.redirect("/pack/" + packId);

        }
    });

    app.get('/uploads/dropbox/:id', function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.params.id;

        if (token) {
            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

            }).then(function (pack) {

                res.render("pages/stickers/upload", {id: pack_id, pack_name: pack.get("name")});


            }, function (error) {
                res.redirect('/');
            })
        } else {
            res.redirect("/");
        }

    });

    app.post('/uploads/dropbox', function (req, res) {
        let bitmap;
        let token = req.cookies.token;
        let pack_id = req.body.pack_id;
        let stickerPack;
        let pack = "/pack/";
        let _previews = [];
        let urls = [];
        let stickerNames = [];
        let stickerTypes = [];
        let name = req.body.fileName;
        let fileUrl = req.body.fileUrl; // receive url from form
        let fileType = req.body.file;

        name = name.substring(0, name.length - 4);
        urls.push(fileUrl);
        stickerNames.push(name);
        stickerTypes.push(fileType);
        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");
                let options = {
                    url: fileUrl,
                    dest: '/app/public/uploads/' + req.body.fileName
                };

                download.image(options)
                    .then(({filename, image}) => {
                        let pack = new Parse.Query(_class.Packs);

                        bitmap = fs.readFileSync(filename, {encoding: 'base64'});

                        util.thumbnailDropbox(urls, stickerNames, stickerTypes).then(previews => {

                            _previews = previews;
                            console.log("PREVIEW FROM DROPBOX " + JSON.stringify(_previews));
                            return pack.equalTo("objectId", pack_id).first({sessionToken: token});

                        }).then(function (pack) {
                            stickerPack = pack;

                            let parseFile = new Parse.File(name, {base64: bitmap});
                            let Sticker = new Parse.Object.extend(_class.Stickers);
                            let sticker = new Sticker();

                            sticker.set("name", name);
                            sticker.set("localName", name);
                            sticker.set("userId", _user.id);
                            sticker.set("uri", parseFile);
                            sticker.set("parent", pack);
                            sticker.set("flagged", false);
                            sticker.set("archived", false);
                            sticker.set("sold", false);

                            return sticker.save();

                        }).then(function (sticker) {

                            let pack_relation = stickerPack.relation(_class.Packs);

                            pack_relation.add(sticker);

                            fs.unlink(filename, function (err) {
                                if (err) {
                                    //TODO handle error code
                                    console.log("Could not del temp++++++++" + JSON.stringify(err));
                                }
                            });

                            return stickerPack.save();

                        }).then(function () {

                            console.log("REDIRECT TO DASHBOARD");
                            res.redirect(pack + pack_id);

                        }, function (error) {
                            console.log("BIG BIG ERROR" + error.message);
                            res.redirect(pack + pack_id);
                        });
                    }).catch((err) => {
                    throw err;
                });
            }, function (error) {
                console.log("SESSION INVALID " + error.message);
                res.redirect(pack + pack_id);
            });

        } else {

            res.redirect(pack + pack_id);

        }

    });

    app.get('/find/sticker/:name', function (req, res) {

        let token = req.cookies.token;
        let name = req.params.name;
        let field = [];

        if (token) {

            field.push(name);

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Stickers).containedIn("categories", field).find();

            }).then(function (stickers) {

                res.render("pages/categories/associated_stickers", {
                    stickers: stickers,
                    name: name
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/categories');
            })
        } else {
            res.redirect('/');
        }

    });

    app.get('/sticker/delete/:id/:packId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let pack_id = req.params.packId;
        let pack = "/pack/";


        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();

            }).then(function (_sticker) {
                    _sticker.destroy({
                        success: function (object) {
                            console.log("removed" + JSON.stringify(object));
                            res.redirect(pack + pack_id);
                        },
                        error: function (error) {
                            console.log("Could not remove" + error);
                            res.redirect(pack + pack_id);

                        }
                    });
                },
                function (error) {
                    console.error(error);
                    res.redirect(pack + pack_id);

                });
        } else {
            res.redirect('/');
        }

    });

    app.post('/sticker/decsription/:id', function (req, res) {

        let token = req.cookies.token;
        let stickerId = req.params.id;
        let description = req.body.description;
        let projectId = req.body.projectId;
        let origin = req.body.origin;
        let sticker = 'sticker';

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

            }).then(function (sticker) {

                sticker.set("description", description);

                return sticker.save();

            }).then(function () {

                // res.redirect(home);
                res.redirect('/notification/' + stickerId + '/' + sticker + '/' + origin + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/');

            })
        }

    });

};