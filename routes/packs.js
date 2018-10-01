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

};