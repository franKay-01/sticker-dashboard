let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let fs = require('fs');

let _ = require('underscore');

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

    app.post('/uploadImgReact', (req, res) => {
      console.log(req);
      let imageFile = req.files.file;
      console.log("IMAGE FILES 1"+JSON.stringify(imageFile));
      console.log("IMAGE FILES 2"+imageFile);
      // imageFile.mv(`${__dirname}/public/${req.body.filename}.jpg`, function(err) {
      //   if (err) {
      //     return res.status(500).send(err);
      //   }
      //
      //   res.json({file: `public/${req.body.filename}.jpg`});
      // });

    });

    app.get('/sendSMS', function (req, res) {
        let token = req.cookies.token;

        if (token) {
            util.getUser(token).then(function (sessionToken) {

                // let numbers = ['+233244504815', '+233241989305', '+447554517595', '+233274556209', '+233544215124', '+233242206380', '+233208266204'];
                let numbers = ['+233244504815'];
                let message = 'We are excited to introduce you to our newest App; CYFA. Get curated Ghanaian stickers & stories. Available on Android & iOS. https://cyfa.io ';

                _.each(numbers, function (number) {
                    util.sendSMS(number, message, function () {

                    });
                });

                res.send("FINISHED");
            })
        } else {
            res.rediect('/');
        }

    });

    app.get('/whatsapp', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            util.getUser(token).then(function (sessionToken) {
                const accountSid = process.env.TWILIO_SID;
                const authToken = process.env.TWILIO_TOKEN;
                const client = require('twilio')(accountSid, authToken);

                client.messages
                    .create({
                        from: 'whatsapp:+14155238886',
                        to: 'whatsapp:+233244504815',
                        body: 'Hello there!'
                    })
                    .then(message => console.log(JSON.stringify(message.sid)))
                    .done();

                res.redirect('/');
            })
        } else {
            res.redirect('/');
        }
    });

    app.get("/feedbacks", function (req, res) {

        new Parse.Query("Feedback").descending("createdAt").find().then(function (feedbacks) {

            res.render("pages/feedback", {
                feedbacks: feedbacks
            });

        });
    });

    app.post("/feedback", function (req, res) {

        let name = req.body.name;
        let profession = req.body.profession;
        let email = req.body.email;
        let number = req.body.number;
        let media = req.body.media;

        let Feedback = new Parse.Object.extend("Feedback");
        let feedback = new Feedback();

        feedback.set("name", name);
        feedback.set("profession", profession);
        feedback.set("email", email);
        feedback.set("number", number);
        feedback.set("social", media);

        feedback.save().then(function (feedback) {
            res.redirect('/feedbacks');
        })

    });

    app.get("/test_nosql/:info", function (req, res) {

        let token = req.cookies.token;
        let info = req.params.info;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                res.send("RESULTS " + info);
            }, function (error) {
                res.send("ERROR " + error.message);
            })
        } else {
            res.redirect('/');
        }
    });

    app.get("/fix_arrays", function (req, res) {

        let token = req.cookies.token;
        let _packs = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).find();

            }).then(function (packs) {

                _.each(packs, function (pack) {
                    console.log("PACK " + JSON.stringify(pack));

                    pack.set("previews", []);
                    _packs.push(pack);

                });
                return Parse.Object.saveAll(_packs);

            }).then(function () {

                console.log("SAVED ALL PACKS");
                res.redirect('/');

            })
        } else {
            res.redirect('/');
        }

    });

    app.get("/test_upload/:id", function (req, res) {
        let token = req.cookies.token;
        let pack_id = req.params.id;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

            }).then(function (pack) {

                res.render("pages/stickers/testupload", {id: pack.id, pack_name: pack.get("name")});

            })
        }
    });

    app.post('/upload_test', upload.array('im1[]'), function (req, res) {

        let token = req.cookies.token;
        let pack_id = req.body.pack_id;
        let files = req.files;
        let fileDetails = [];
        let stickerDetails = [];
        let stickerCollection;
        let preview_file;

        let filePreviews = [];

        if (token) {
            util.thumbnail(files).then(previews => {
                console.log(JSON.stringify(previews));
                res.send(JSON.stringify(previews));
            });


        } else {

            res.redirect("/");

        }
    });

    app.get('/get_acl', function (req, res) {
        let token = req.cookies.token;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                console.log("SESSION " + JSON.stringify(sessionToken));
                return new Parse.Query("Test").find({sessionToken: sessionToken.get("sessionToken")});

            }).then(function (test) {
                res.send("TEST RESULTS " + JSON.stringify(test));
            }, function (error) {
                res.send("TEST FAILED " + error.message);
            })
        }
    });

    app.get('/test_acl/:id/:text', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let text = req.params.text;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");
                let Test = new Parse.Object.extend("Test");
                let test = new Test();

                test.set("text_id", id);
                test.set("text", text);


                let ACL = new Parse.ACL();
                ACL.setReadAccess(_user.id, true);
                ACL.setWriteAccess(_user.id, true);
                ACL.setPublicReadAccess(true);


                test.setACL(ACL);

                return test.save();


            }).then(function (test) {

                res.send("TEST COMPLETE " + JSON.stringify(test));
            }, function (error) {
                res.send("TEST FAILED " + error.message);

            })

        }
    });

    app.get('/role', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            let _user = {};

            util.getUser(token).then(function (sessionToken) {

                // var roleACL = new Parse.ACL();
                // roleACL.setPublicReadAccess(true);
                // var role = new Parse.Role("Administrator", roleACL);
                // role.getUsers().add(_user);
                //
                // return role.save();

                let queryRole = new Parse.Query(Parse.Role);
                queryRole.equalTo('name', 'Administrator');
                queryRole.first({
                    success: function (admin) {
                        console.log("ADMIN " + JSON.stringify(admin));

                        let adminRelation = admin.Relation('_User');

                        adminRelation.add(_user);

                        return admin.save();
                    },
                    error: function (error) {
                        res.send("ROLE FAILED " + error.message);

                    }
                });

                // var roleACL = new Parse.ACL();
                // roleACL.setPublicReadAccess(true);
                // var role = new Parse.Role("Administrator", roleACL);
                // role.save();

            }).then(function (admin) {
                res.send("ROLE COMPLETE " + JSON.stringify(admin));

            }, function (error) {
                res.send("ROLE FAILED " + error.message);

            })
        }
    });

    app.get('/chats', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query("Chats").ascending("createdAt").find();

            }).then(function (chats) {

                res.render("pages/chats", {
                    chats: chats
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/');
            })

        }else {
            res.redirect('/');
        }
    })
};
