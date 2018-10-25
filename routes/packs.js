let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let fs = require('fs');
let _ = require('underscore');

const NORMAL_USER = 2;
const SUPER_USER = 0;
const PARSE_LIMIT = 2000;
const SPECIAL_CHARACTERS = /[`~!@#$%^&*()_|+\-=÷¿?;:'",.123<>\{\}\[\]\\\/]/gi;

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

    app.get('/packs/:projectId', function (req, res) {

        let token = req.cookies.token;
        let projectId = req.params.projectId;
        let projectArray = [];

        if (token) {
            let _user = {};
            projectArray.push(projectId);

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).containedIn("projectIds", projectArray).ascending("createdAt").find(),
                    new Parse.Query(_class.Projects).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                );

            }).then(function (collections, projects, projectItem) {

                res.render("pages/packs/packs", {
                    packs: collections,
                    projects: projects,
                    projectItem: projectItem,
                    type: type
                });

            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect("/");
            })
        }

        else {
            console.log("No Session Exists, log in");
            res.redirect("/");
        }
    });

    app.post('/pack', function (req, res) {

        let token = req.cookies.token;
        let pack_description = req.body.pack_description;
        let coll_name = req.body.coll_name;
        let projectId = req.body.projectId;
        let packCategory = req.body.packCategory;
        let packType = parseInt(req.body.packType);
        let version = parseInt(req.body.version);
        let projectArray = [];
        let NSFW = "NSFW;
        projectArray.push(projectId);

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                let PackCollection = new Parse.Object.extend(_class.Packs);
                let pack = new PackCollection();
                pack.set("name", coll_name);
                pack.set("description", pack_description);
                pack.set("userId", _user.id);
                pack.set("status", type.PACK_STATUS.pending);
                pack.set("version", version);
                pack.set("projectIds", projectArray);
                pack.set("productId", "");
                pack.set("archived", false);
                pack.set("flagged", false);
                pack.set("published", false);
                pack.set("previews", {});
                if (packCategory === NSFW){
                    pack.set("keywords", [packCategory]);
                }else if (packCategory !== NSFW){
                    pack.set("keywords", [""]);
                }

                if (packType === type.PACK_TYPE.grouped) {

                    pack.set("packType", type.PACK_TYPE.grouped);

                } else if (packType === type.PACK_TYPE.themed) {

                    pack.set("packType", type.PACK_TYPE.themed);

                } else if (packType === type.PACK_TYPE.curated) {

                    pack.set("packType", type.PACK_TYPE.curated);

                }

                return pack.save();

            }).then(function (collection) {

                res.redirect('/pack/' + collection.id + '/' + projectId);

            }, function (error) {
                console.log("ERROR OCCURRED WHEN ADDING NEW PACK " + error.message);
                console.log('/');
            })
        }
        else {
            res.redirect("/");
        }
    });

    app.get('/pack/:packId/:projectId', function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.params.packId;
        let projectId = req.params.projectId;
        let limit = 5;
        let is_published = false;
        let pack_art = false;

        if (token) {

            let _user = {};
            let userType;
            let pack_name;
            let pack_status;
            let page;
            let _stickers;
            let productId;
            let _pack;

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");
                userType = _user.get("type");

                let query = new Parse.Query(_class.Packs).equalTo("objectId", pack_id);

                switch (userType) {
                    case SUPER_USER:
                        return query.first({useMasterKey: true});

                    case NORMAL_USER:
                        return query.first({sessionToken: token});

                }

            }).then(function (pack) {
                _pack = pack;
                pack_status = pack.get("status");
                pack_art = pack.get("artwork");
                is_published = pack.get("published");
                pack_name = pack.get("name");
                packType = pack.get("packType");
                productId = pack.get("productId");

                let packRelation = pack.relation(_class.Packs);

                switch (userType) {
                    case SUPER_USER:
                        return packRelation.query().limit(PARSE_LIMIT).ascending("name").find({useMasterKey: true});

                    case NORMAL_USER:
                        return packRelation.query().find({sessionToken: token});

                }
            }).then(function (stickers) {

                _stickers = stickers;

                return Parse.Promise.when(
                    new Parse.Query(_class.Packs).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.Product).find(),
                    new Parse.Query(_class.Projects).containedIn("objectId", _pack.get("projectIds")).limit(limit).find(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                );

            }).then(function (packs, products, projects, project) {

                page = util.page(packs, pack_id);

                switch (userType) {
                    case SUPER_USER:
                        res.render("pages/packs/admin_pack", {
                            stickers: _stickers,
                            id: pack_id,
                            art: pack_art,
                            published: is_published,
                            pack_name: pack_name,
                            userType: _user.get("type"),
                            status: pack_status,
                            next: page.next,
                            previous: page.previous,
                            pack_type: packType,
                            type: type,
                            productId: productId,
                            products: products,
                            currentProjects: projects,
                            projectItem: project
                        });
                        break;

                    case NORMAL_USER:
                        res.render("pages/packs/new_pack", {
                            stickers: _stickers,
                            id: pack_id,
                            pack_name: pack_name,
                            art: pack_art,
                            published: is_published,
                            status: pack_status,
                            next: page.next,
                            previous: page.previous,
                            type: type,
                            productId: productId,
                            products: products
                        });
                        break;
                }
            }, function (error) {
                console.log("score lookup failed with error.code: " + error.code + " error.message: " + error.message);
                res.redirect("/");
            })
        }
        else {
            //No session exists, log in
            res.redirect("/");
        }
    });

    app.post('/pack/product', function (req, res) {

        let token = req.cookies.token;
        let packId = req.body.packId;
        let productId = req.body.productId;
        let projectId = req.body.projectId;
        let zero = "0";

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).equalTo("objectId", packId).first();

            }).then(function (pack) {

                if (productId === zero) {
                    pack.set("productId", "free");
                } else {
                    pack.set("productId", productId);
                }

                return pack.save();

            }).then(function (pack) {

                res.redirect('/pack/stickers/' + packId + '/' + pack.get("productId") + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/' + packId + '/' + projectId);
            })

        } else {
            res.redirect('/');
        }

    });


    app.post('/pack/project/update', function (req, res) {

        let token = req.cookies.token;
        let packId = req.body.packId;
        let projectId = req.body.projectId;

        if (token) {

            getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).equalTo("objectId", packId).first();

            }).then(function (pack) {

                pack.set("projectId", projectId);
                return pack.save();

            }).then(function () {

                res.redirect('/pack/' + packId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/' + packId)
            })
        } else {
            res.redirect('/');
        }
    });


    app.post('/pack/product/update', function (req, res) {

        let token = req.cookies.token;
        let packId = req.body.packId;
        let productId = req.body.productId;
        let projectId = req.body.projectId;
        let _stickers = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).equalTo("objectId", packId).first();

            }).then(function (pack) {

                if (productId !== "free") {
                    pack.set("productId", productId);
                } else {
                    pack.set("productId", "free");
                }

                return pack.save();
            }).then(function (pack) {

                return new Parse.Query(_class.Stickers).equalTo("parent", {
                    __type: 'Pointer',
                    className: _class.Packs,
                    objectId: packId
                }).find();

            }).then(function (stickers) {

                console.log("STICKERS " + JSON.stringify(stickers));

                _.each(stickers, function (sticker) {

                    sticker.set("productId", productId);
                    if (productId !== "free") {
                        sticker.set("sold", true);
                    } else {
                        sticker.set("sold", false);
                    }
                    _stickers.push(sticker);

                });

                return Parse.Object.saveAll(_stickers);

            }).then(function (stickers) {

                res.redirect('/pack/edit/' + packId + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/edit/' + packId + '/' + projectId);

            })
        } else {

            res.redirect('/');

        }

    });


    app.get('/pack/edit/:packId/:projectId', function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.params.packId;
        let projectId = req.params.projectId;
        let _pack;
        let _productId;
        let _projectId;
        let productDetails;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {
                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first(),
                    new Parse.Query(_class.Product).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()
                );

            }).then(function (pack, productId, projectId) {
                _pack = pack;
                _productId = productId;
                _projectId = projectId;

                return new Parse.Query(_class.Product).equalTo("objectId", pack.get("productId")).first();

            }).then(function (productInfo) {
                console.log("HERE 2 " + productInfo);

                if (productInfo !== undefined) {
                    productDetails = productInfo.get("name");
                }

                if (_pack.get("productId") === "free") {

                    productDetails = "FREE";
                }

                res.render("pages/packs/pack_details", {
                    pack_details: _pack,
                    productId: _productId,
                    projectItem: _projectId,
                    productDetails: productDetails,
                    type: type
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/pack/" + pack_id);
            })
        } else {
            res.redirect('/');
        }
    });

    app.post('/pack/edit/:id', upload.array('art'), function (req, res) {

        let token = req.cookies.token;
        let files = req.files;
        let id = req.params.id;
        let keywords = req.body.keyword;
        let packName = req.body.pack_name;
        let archive = req.body.archive;
        let packVersion = parseInt(req.body.packVersion);
        let productId = req.body.productId;
        let projectId = req.body.projectId;
        let description = req.body.description;
        let _keywords = [];
        let fileDetails = [];
        let _previews = [];

        if (keywords !== undefined || keywords !== "undefined") {
            _keywords = keywords.split(",");
        }

        if (archive === undefined || archive === "undefined") {
            archive = false;
        } else if (archive === 1 || archive === "1") {
            archive = true;
        } else if (archive === 0 || archive === "0") {
            archive = false;
        }

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                if (files.length > 0) {

                    return util.thumbnail(files)

                } else {
                    return true;
                }

            }).then(previews => {

                _previews = previews;
                return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

            }).then(function (pack) {

                pack.set("description", description);
                pack.set("keywords", _keywords);
                pack.set("archived", archive);
                pack.set("productId", productId);
                pack.set("version", packVersion);
                if (packName !== undefined || packName !== "undefined") {
                    pack.set("name", packName);
                }

                if (files !== undefined || files !== "undefined") {
                    files.forEach(function (file) {
                        let fullName = file.originalname;
                        let stickerName = fullName.substring(0, fullName.length - 4);

                        let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                        let bitmapPreview;
                        let parseFilePreview;

                        // _.map(_previews, preview => {
                        let changedStickerName = stickerName.replace(SPECIAL_CHARACTERS, '').substring(0, stickerName.length - 4);
                        if (changedStickerName === _previews[0].name) {
                            bitmapPreview = fs.readFileSync(_previews[0].path, {encoding: 'base64'});
                            parseFilePreview = new Parse.File(stickerName, {base64: bitmapPreview}, _previews[0].mimetype);
                        }
                        // });

                        let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);

                        pack.set("artwork", parseFile);
                        pack.set("preview", parseFilePreview);
                        fileDetails.push(file);

                    });
                }

                return pack.save();

            }).then(function (pack) {

                console.log("PACK " + JSON.stringify(pack));
                _.each(fileDetails, function (file) {
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

                return true;

            }).then(function () {

                res.redirect('/pack/edit/' + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/edit/' + id + '/' + projectId);

            })
        } else {
            res.redirect('/');
        }

    });

    app.post('/pack/review/:id', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.id;
        let name = req.body.pack_name;
        let archive = req.body.archive;
        let description = req.body.pack_description;
        let keyword = req.body.keyword;
        let review_id = req.body.review_id;
        let reviewEdit = '/review/edit/';

        let key = keyword.split(",");

        if (token) {
            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Packs).equalTo("objectId", id).first();
            }).then(function (pack) {
                pack.set("name", name);

                if (archive === undefined || archive === "1") {
                    pack.set("archived", false);
                } else if (archive === "0") {
                    pack.set("archived", true);
                }
                pack.set("description", description);
                pack.set("keywords", key);

                return pack.save();

            }).then(function (result) {
                res.redirect(reviewEdit + review_id);
            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect(reviewEdit + review_id);
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/pack/review/update/status/:id', function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.params.id;
        let pack = '/pack/';

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

            }).then(function (pack) {

                pack.set("status", type.PACK_STATUS.review);
                return pack.save();

            }).then(function () {

                console.log("PACK SUBMITTED FOR REVIEW");
                res.redirect(pack + pack_id);

            }, function (error) {

                console.log("PACK NOT SUBMITTED FOR REVIEW. ERROR " + error.message);
                res.redirect(pack + pack_id);

            });
        } else {
            res.redirect('/');
        }
    });

    app.post('/review/:itemId/:packId/:reviewId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.itemId;
        let pack_ = req.params.packId;
        let review_id = req.params.reviewId;
        let _type = req.body.type;
        let categoryNames = [];
        let reviewEdit = '/review/edit/';
        let all;
        let name;
        let category;
        let sticker;

        if (token) {
            let _user = {};

            if (_type === "1") {

                util.getUser(token).then(function (sessionToken) {

                    _user = sessionToken.get("user");

                    return Parse.Promise.when(
                        new Parse.Query(_class.Stickers).equalTo("objectId", id).first(),
                        new Parse.Query(_class.Categories).find()
                    );

                }).then(function (sticker, categories) {

                        stickerDetail = sticker;
                        allCategories = categories;

                        let sticker_relation = sticker.relation(_class.Categories);
                        return sticker_relation.query().find();

                    }
                ).then(function (stickerCategories) {

                    _.each(stickerCategories, function (category) {
                        categoryNames.push(category.get("name"))
                    });

                    return new Parse.Query(_class.Reviews).equalTo("objectId", review_id).first();

                }).then(function (review) {

                    let review_fields = review.get("reviewField");
                    let review_field = Array.from(review_fields);

                    for (let time = 0; time < review_field.length; time++) {
                        if (review_field[time] === "all") {
                            all = review_field[time];
                        } else if (review_field[time] === "name") {
                            name = review_field[time];
                        } else if (review_field[time] === "category") {
                            category = review_field[time];
                        } else if (review_field[time] === STICKER) {
                            sticker = review_field[time];
                        }
                    }

                    res.render("pages/stickers/edit_sticker", {
                        sticker: stickerDetail,
                        categoryNames: categoryNames,
                        categories: allCategories,
                        pack_id: pack_,
                        all: all,
                        name: name,
                        sticker_details: sticker,
                        category: category,
                        review_id: review_id
                    });

                }, function (error) {
                    console.log("ERROR " + error.message);
                    res.redirect(reviewEdit + review_id);
                });
            } else {
                getUser(token).then(function (sessionToken) {

                    _user = sessionToken.get("user");

                    return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

                }).then(function (pack) {

                    res.render("pages/packs/edit_pack", {pack: pack, review_id: review_id});

                }, function (error) {

                    console.log("ERROR " + error.message);
                    res.redirect(reviewEdit + review_id);

                });
            }
        } else {
            res.redirect('/')
        }

    });

    app.get('/pack/stickers/remove/:stickerId/:packId/:projectId', function (req, res) {

        let token = req.cookies.token;
        let stickerId = req.params.stickerId;
        let projectId = req.params.projectId;
        let packId = req.params.packId;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first(),
                    new Parse.Query(_class.Packs).equalTo("objectId", packId).first()
                )
            }).then(function (sticker, pack) {

                let collection_relation = pack.relation(_class.Packs);
                collection_relation.remove(sticker);

                return pack.save();

            }).then(function () {

                res.redirect('/pack/' + packId + '/' + projectId);

            }, function (error) {

                console.log("ERROR REMOVING STICKER RELATION " + error.message);
                res.redirect('/pack/' + packId + '/' + projectId);

            })
        } else {
            res.redirect('/');
        }

    });

    app.post('/pack/stickers/:packId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.packId;
        let stickerIds = req.body.stickerIds;
        let projectId = req.body.projectId;
        let _stickerIds = [];

        console.log("STICKERS " + stickerIds);
        _stickerIds = stickerIds.split(",");
        console.log("STICKERS " + _stickerIds);

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).containedIn("objectId", _stickerIds).find(),
                    new Parse.Query(_class.Packs).equalTo("objectId", id).first()
                )

            }).then(function (stickers, pack) {

                _.each(stickers, function (sticker) {
                    let collection_relation = pack.relation(_class.Packs);
                    collection_relation.add(sticker);
                });

                return pack.save();

            }).then(function (pack) {

                res.redirect('/pack/' + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/' + id + '/' + projectId);

            })

        } else {
            res.redirect('/');
        }
    });

    app.get('/pack/create/previews/:packId/:projectId', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.packId;
        let projectId = req.params.projectId;
        let STICKER_LIMIT = 6;
        let _pack;
        let stickerArray = [];

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

            }).then(function (pack) {

                _pack = pack;
                if (pack.get("previews").length > 0) {

                    res.redirect('/pack/' + id);

                } else {
                    let packRelation = pack.relation(_class.Packs);
                    return packRelation.query().limit(STICKER_LIMIT).ascending("name").find();
                }

            }).then(function (stickers) {

                _.each(stickers, function (sticker) {

                    stickerArray.push(sticker.get("preview").url());

                });

                return _pack.save("previews", stickerArray);

            }).then(function (pack) {

                res.redirect('/pack/' + id + '/' + projectId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/' + id + '/' + projectId);

            })

        } else {
            res.redirect('/');
        }
    });

    app.get('/pack/stickers/:packId/:productId/:projectId', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.packId;
        let productId = req.params.productId;
        let projectId = req.params.projectId;
        let free = [];
        let paid = [];

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                // return new Parse.Query(_class.Packs).equalTo("objectId", id).first();
                return new Parse.Query(_class.Packs).equalTo("packType", type.PACK_TYPE.grouped).find();

            }).then(function (packs) {

                let _stickers = [];

                _.each(packs, function (pack) {

                    _stickers.push(pack.id);

                });

                return Parse.Promise.when(

                    new Parse.Query(_class.Stickers).limit(PARSE_LIMIT).containedIn("parent", _stickers).find(),
                    new Parse.Query(_class.Projects).equalTo("objectId", projectId).first()

                )

            }).then(function (stickers, project) {

                if (productId === "free") {
                    _.each(stickers, function (sticker) {

                        if (sticker.get("sold") === false) {

                            free.push(sticker);

                        }
                    });
                } else if (productId !== "free") {
                    _.each(stickers, function (sticker) {

                        // if (sticker.get("sold") === true) {

                        paid.push(sticker);

                        // }
                    });
                }

                res.render("pages/packs/select_stickers", {
                    id: id,
                    freeStickers: free,
                    paidStickers: paid,
                    projectItem: project

                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/' + id + '/' + projectId);
            })

        } else {
            res.redirect('/');
        }
    });


};