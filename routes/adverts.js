let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let _ = require('underscore');
let multer = require('multer');
let fs = require('fs');

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

    app.post('/advert/image/:id', upload.array('adverts'), function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let type = parseInt(req.body.type);
        let files = req.files;
        let fileDetails = [];
        let advertDetails = [];
        let advertRedirect = '/advert/edit/';
        let imageArray = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.AdvertImages).equalTo("advertId", id).first();

            }).then(function (advert) {

                // if (imageArray.length > 0) {
                //     // advertMessage = "ADVERT under category already exist";
                //     //     res.redirect('/advert/edit/' + id);
                // } else {
                if (files) {

                    files.forEach(function (file) {

                        let fullName = file.originalname;
                        let image_name = fullName.substring(0, fullName.length - 4);

                        let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                        //create our parse file
                        let parseFile = new Parse.File(image_name, {base64: bitmap}, file.mimetype);
                        console.log("PARSEFILE " + JSON.stringify(parseFile));

                        let Advert_Image = new Parse.Object.extend(_class.AdvertImages);
                        let advert_image = new Advert_Image();

                        advert_image.set("name", image_name);
                        advert_image.set("advertId", id);
                        advert_image.set("uri", parseFile);
                        advert_image.set("type", type);

                        advertDetails.push(advert_image);
                        fileDetails.push(file);

                    });

                    advertMessage = "";

                    return Parse.Object.saveAll(advertDetails);
                }
                // }
            }).then(function () {

                if (fileDetails.length) {
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
                }

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