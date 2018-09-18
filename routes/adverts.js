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
                console.log("ADVERT TITLE " + adverts.length + " AND " + _adverts.length);
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

    app.get('/advert/edit/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.Adverts).equalTo("objectId", id).first(),
                    new Parse.Query(_class.AdvertImages).equalTo("advertId", id).find(),
                    new Parse.Query(_class.Links).equalTo("itemId", id).first()
                );

            }).then(function (advert, advertImage, link) {

                res.render("pages/adverts/advert_details", {

                    ad_details: advert,
                    ad_images: advertImage,
                    link: link,
                    advertMessage: advertMessage
                })

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home');
            })

        } else {

            res.redirect('/');

        }
    });

    app.post('/update/advert/link/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let type = parseInt(req.body.type);
        let link = req.body.link;
        let advertRedirect = '/advert/edit/';

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Links).equalTo("itemId", id).first();

            }).then(function (links) {

                if (links) {

                    res.redirect(advertRedirect + id);

                } else {

                    let Links = new Parse.Object.extend(_class.Links);
                    let links = new Links();

                    links.set("type", type);
                    links.set("itemId", id);
                    links.set("link", link);

                    return links.save();
                }

            }).then(function (link) {

                res.redirect(advertRedirect + id);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(advertRedirect + id);

            })
        } else {

            res.redirect('/');

        }
    });


};