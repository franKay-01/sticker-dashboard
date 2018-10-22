let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');

module.exports = function (app) {

    app.get('/reviews', function (req, res) {

        let token = req.cookies.token;

        if (token) {
            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Reviews).equalTo('owner', _user.id).find(); // Set our channel

            }).then(function (review) {
                // res.send(JSON.stringify(review));
                res.render("pages/reviews/review_collection", {reviews: review});

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home');

            });
        } else {
            res.redirect('/');

        }
    });

    app.get('/review/:id', function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.params.id;
        let packs = '/packs';

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs);

            }).then(function (pack) {

                pack.get(pack_id, {
                    success: function (pack) {
                        let pack_name = pack.get("name");
                        let pack_owner = pack.get("userName");
                        let pack_owner_id = pack.get("userId");
                        let art = pack.get("artwork");
                        let pack_id = pack.id;
                        let _description = pack.get("description");

                        //
                        // new Parse.Query("User").equalTo("objectId", pack_owner).find().then(function (user) {
                        //     _owner = user;
                        //     console.log("ABOUT TO SEARCH FOR USER "+JSON.stringify(_owner));
                        // }, function (error) {
                        //     console.log("ERROR "+error.message);
                        // });

                        res.render("pages/reviews/review_page", {
                            id: pack_id,
                            packName: pack_name,
                            owner: pack_owner,
                            art_work: art,
                            owner_id: pack_owner_id,
                            description: _description
                        });
                    },
                    error: function (error) {
                        console.log("ERROR " + error.message);
                        res.redirect(packs);
                    }

                });
            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect(packs);
            });
        } else {
            res.redirect('/');
        }
    });

    app.post('/review/pack/:id', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let comment = req.body.review_text;
        let status = req.body.approved;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                let Reviews = new Parse.Object.extend("Reviews");
                let review = new Reviews();

                new Parse.Query(_class.Packs).equalTo("objectId", id).first().then(function (pack) {
                    console.log("PACK FROM REVIEW " + JSON.stringify(pack));
                    if (status === "2") {
                        pack.set("status", type.PACK_STATUS.approved);
                    } else if (status === "1") {
                        pack.set("status", type.PACK_STATUS.rejected);
                    }
                    review.set("image", pack.get("artwork").url());
                    review.set("name", pack.get("name"));
                    review.set("owner", pack.get("userId"));
                    review.set("packId", pack.id);
                    return pack.save();

                }).then(function () {

                    if (status === "2") {
                        review.set("approved", true);
                    } else if (status === "1") {
                        review.set("approved", false);
                    }
                    review.set("comments", comment);
                    review.set("reviewer", _user.id);
                    review.set("reviewerName", _user.get("name"));
                    review.set("typeId", id);
                    review.set("reviewField", []);
                    review.set("type", 0);

                    return review.save();
                }).then(function () {
                    console.log("PACK WAS SUCCESSFULLY REVIEWED");
                    res.redirect('/pack/' + id);
                });
            }, function (error) {
                console.log("ERROR OCCURRED WHEN REVIEWING " + error.message);
                res.redirect('/review/' + id);
            });
        } else {
            res.redirect('/');

        }
    });

    app.get('/review/edit/:id', function (req, res) {

        let token = req.cookies.token;
        let review_id = req.params.id;

        if (token) {

            let _user = {};
            let _review = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Reviews).equalTo("objectId", review_id).first();

            }).then(function (review) {
                _review = review;

                let _type = review.get("type");
                if (_type === 1) {
                    let id = review.get("typeId");
                    return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();
                } else {
                    res.render("pages/reviews/review_details", {reviews: review});
                }

            }).then(function (sticker) {
                let sticker_url = sticker.get("uri").url();
                res.render("pages/reviews/review_details", {reviews: _review, sticker_url: sticker_url});

            }, function (error) {
                console.log("ERROR WHEN RETRIEVING REVIEW " + error.message);
                res.redirect('/reviews');
            });
        } else {
            res.redirect('/');

        }
    });

    app.post('/review/sticker/:stickerId/:packId', function (req, res) {
        let token = req.cookies.token;
        let id = req.params.stickerId;
        let pack_id = req.params.packId;
        let field = req.body.reviewField;
        let comments = req.body.review_text;
        let status = req.body.flagged;

        let review_field = field.split(",");

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");
                let Sticker_review = new Parse.Object.extend(_class.Reviews);
                let reviews = new Sticker_review();

                new Parse.Query(_class.Stickers).equalTo("objectId", id).first().then(function (sticker) {
                    if (status === "2") {
                        sticker.set("flagged", true);
                    } else if (status === "1") {
                        sticker.set("flagged", false);
                    }
                    reviews.set("image", sticker.get("uri").url());
                    reviews.set("name", sticker.get("name"));
                    reviews.set("owner", sticker.get("userId"));

                    let _pack = sticker.get("parent");
                    _pack.fetch({
                        success: function (_pack) {

                            reviews.set("packId", _pack.id);

                        }
                    });

                    return sticker.save();

                }).then(function () {

                    if (status === "1") {
                        reviews.set("approved", true);
                    } else if (status === "2") {
                        reviews.set("approved", false);
                    }
                    reviews.set("comments", comments);
                    reviews.set("reviewer", _user.id);
                    reviews.set("reviewerName", _user.get("name"));
                    reviews.set("typeId", id);
                    reviews.set("reviewField", review_field);

                    reviews.set("type", 1);
                    return reviews.save();

                }).then(function () {

                    console.log("STICKER REVIEWED");
                    res.redirect("/pack/" + pack_id);

                }, function (error) {

                    console.log("STICKER REVIEW FAILED " + error.message);
                    res.redirect("/sticker/edit/" + id + "/" + pack_id);

                });
            });
        } else {
            res.redirect('/');
        }
    });

    app.get('/review/find/packs', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).equalTo("status", type.PACK_STATUS.review).find();

            }).then(function (pack) {

                res.render("pages/packs/packs_for_admin", {

                    collection: pack

                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/home');

            });

        } else {
            res.redirect('/');

        }
    });
};