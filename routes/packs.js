let helper = require('../cloud/modules/helpers');
let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let fs = require('fs');

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


};