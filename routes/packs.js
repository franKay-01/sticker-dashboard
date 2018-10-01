let helper = require('../cloud/modules/helpers');
let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let fs = require('fs');

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

    app.get('/packs', function (req, res) {

        let token = req.cookies.token;

        if (token) {
            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");
                let query = new Parse.Query(_class.Packs);
                query.equalTo("userId", _user.id).ascending("createdAt").find({sessionToken: token}).then(function (collections) {

                    res.render("pages/packs/packs", {
                        packs: collections,
                        type: type
                    });
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
        let packType = parseInt(req.body.packType);
        let version = parseInt(req.body.version);

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
                pack.set("productId", "");
                pack.set("archived", false);
                pack.set("flagged", false);
                pack.set("published", false);
                pack.set("previews", []);

                if (packType === type.PACK_TYPE.grouped) {

                    pack.set("packType", type.PACK_TYPE.grouped);

                } else if (packType === type.PACK_TYPE.themed) {

                    pack.set("packType", type.PACK_TYPE.themed);

                } else if (packType === type.PACK_TYPE.curated) {

                    pack.set("packType", type.PACK_TYPE.curated);

                }

                return pack.save();

            }).then(function (collection) {

                res.redirect('/pack/' + collection.id);

            }, function (error) {
                console.log("ERROR OCCURRED WHEN ADDING NEW PACK " + error.message);
                console.log('/');
            })
        }
        else {
            res.redirect("/");
        }
    });

    app.get('/pack/:id', function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.params.id;

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
                );

            }).then(function (packs, products) {

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
                            products: products
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

                res.redirect('/pack/stickers/' + packId + '/' + pack.get("productId"));

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/' + packId);
            })

        } else {
            res.redirect('/');
        }

    });

    /*
    app.post('/pack/product/update', function (req, res) {

        let token = req.cookies.token;
        let packId = req.body.packId;
        let productId = req.body.productId;
        let _stickers = [];

        console.log("PRODUCT ID " + productId);

        if (token) {

            getUser(token).then(function (sessionToken) {

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

                res.redirect('/pack/edit/' + packId);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/edit/' + packId);

            })
        } else {

            res.redirect('/');

        }

    });
    */

    app.get('/pack/edit/:id', function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.params.id;
        let _pack;
        let _productId;
        let productDetails;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {
                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first(),
                    new Parse.Query(_class.Product).equalTo("userId", _user.id).find()
                );

            }).then(function (pack, productId) {
                _pack = pack;
                _productId = productId;

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

                console.log("FOUND USER " + JSON.stringify(files));
                if (files) {

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

                res.redirect('/pack/edit/' + id);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/pack/edit/' + id);

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

};