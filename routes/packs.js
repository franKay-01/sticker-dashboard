let helper = require('../cloud/modules/helpers');
let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let fs = require('fs');

const NORMAL_USER = 2;
const SUPER_USER = 0;

const PARSE_LIMIT = 2000;

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


};