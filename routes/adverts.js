let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let _ = require('underscore');

let advertMessage = "";

module.exports = function(app) {

    app.get('/adverts', function (req, res) {

        let token = req.cookies.token;
        let _adverts = [];
        let _user = {};

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Adverts).equalTo("userId", _user.id).find(),
                    new Parse.Query(_class.AdvertImages).find(),
                );

            }).then(function (adverts, ad_images) {

                _.each(adverts, function (advert) {

                    _.each(ad_images, function (image) {

                        if (advert.id === image.get("advertId")) {

                            //TODO modify query to group types
                            //TODO use type constants from types JS e.g type.LINKS.android
                            if (image.get("type") === 0) {
                                _adverts.push({
                                    advert: advert,
                                    image: image.get("uri").url()
                                })
                            }
                        }

                    });
                });

                let spliced = [];
                console.log("ADVERT TITLE " + JSON.stringify(_adverts[0].advert.get("title")));
                for (let i = 0; i < adverts.length; i = i + 1) {

                    console.log("ADVERTS " + JSON.stringify(adverts[i]));

                    for (let j = 0; j < _adverts.length; j = j + 1) {

                        if (adverts[i].get("title") === _adverts[j].advert.get("title")) {
                            console.log("SPLICED ITEM " + JSON.stringify(adverts[i]));

                            adverts.splice(i, 1);
                            spliced.push(i);
                            console.log("SPLICED************");
                        }
                    }
                }

                advertMessage = "";

                console.log("ADVERTS " + JSON.stringify(_adverts) + " AND " + JSON.stringify(adverts));

                res.render("pages/adverts/advert_collection", {
                    adverts: _adverts,
                    adverts_no_image: adverts,
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