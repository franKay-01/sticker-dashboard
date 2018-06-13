let express = require('express');
let router = express.Router();

router.get('/download/json/:className/', function (req, res) {

    //delete all items in the database
    let className = req.params.className;

    new Parse.Query(className).find().then((items) => {
        let _text = [];
        _.each(items, item => {
            _text.push({"name": item.get("name")});
        });
        res.send(JSON.stringify(_text))
    })

});


router.get('/upload/json/:className/:fileName', function (req, res) {

    //delete all items in the database
    let fileName = req.params.fileName;
    let className = req.params.className;

    new Parse.Query(className).limit(1000).find().then((items) => {
        return Parse.Object.destroyAll(items);
    }).then(() => {

        let rawdata = fs.readFileSync('public/json/categories.json');
        let categories = JSON.parse(rawdata);

        let categoryList = [];
        categories.forEach(function (category) {

            let Category = new Parse.Object.extend(CategoryClass);
            let _category = new Category();

            _category.set("name", category.name.toLowerCase());
            categoryList.push(_category);

        });

        return Parse.Object.saveAll(categoryList);

    }).then(categories => {
        res.send("saved")
    }, error => {
        res.send(JSON.stringify(error))
    });


});

router.get("/test_upload/:id", function (req, res) {
    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {
        getUser(token).then(function (sessionToken) {

            return new Parse.Query(PacksClass).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            res.render("pages/testupload", {id: pack.id, pack_name: pack.get("pack_name")});

        })
    }
});


//TODO put all experiments in a seperate js file and require
router.post('/upload_test', upload.array('im1[]'), function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.body.pack_id;
    let files = req.files;
    let fileDetails = [];
    let stickerDetails = [];
    let stickerCollection;
    let preview_file;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let db = admin.database();

            // change this to shorter folder
            let ref = db.ref("server/saving-data/fireblog");

            let statsRef = ref.child("/gstickers-e4668");

            new Parse.Query(PacksClass).equalTo("objectId", pack_id).first({sessionToken: token}).then(function (collection) {

                stickerCollection = collection;

                files.forEach(function (file, index) {

                    let Sticker = new Parse.Object.extend(StickerClass);
                    let sticker = new Sticker();

                    let fullName = file.originalname;
                    let stickerName = fullName.substring(0, fullName.length - 4);

                    let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                    gm(file.path)
                        .resize(200, 200)
                        .write('public/uploads/' + stickerName, function (err) {
                            if (!err)
                                console.log('done ' + stickerName);

                            let bitmapPreview = fs.readFileSync('public/uploads/' + stickerName, {encoding: 'base64'});

                            //create our parse file
                            let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                            let parsePreviewFile = new Parse.File(stickerName, {base64: bitmapPreview});

                            console.log("PARSIFY" + JSON.stringify(parsePreviewFile));

                            sticker.set("stickerName", stickerName);
                            sticker.set("localName", stickerName);
                            sticker.set("uri", parseFile);
                            sticker.set("preview", parsePreviewFile);
                            sticker.set("user_id", _user.id);
                            sticker.set("parent", collection);
                            sticker.set("description", "");
                            sticker.set("flag", false);
                            sticker.set("archive", false);
                            sticker.set("sold", false);
                            // sticker.setACL(setPermission(_user, false));

                            stickerDetails.push(sticker);
                            fileDetails.push(file);

                        });

                    if ((index - 1) === files.length) {
                        console.log("SAVE ALL OBJECTS AND FILE");
                        return Parse.Object.saveAll(stickerDetails);
                    }

                });

            }).then(function (stickers) {

                console.log("STICKIFY " + JSON.stringify(stickers));

                _.each(fileDetails, function (file) {
                    //Delete tmp fil after upload
                    let tempFile = file.path;
                    fs.unlink(tempFile, function (err) {
                        if (err) {
                            //TODO handle error code
                            console.log("-------Could not del temp" + JSON.stringify(err));
                        }
                        else {
                            console.log("SUUCCCEESSSSS IN DELTEING TEMP");
                        }
                    });
                });

                _.each(stickers, function (sticker) {
                    let collection_relation = stickerCollection.relation(PacksClass);
                    collection_relation.add(sticker);
                });

                console.log("SAVE COLLECTION RELATION");
                return stickerCollection.save();

            }).then(function () {

                let mailgun = new Mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});
                let data = {
                    //Specify email data
                    from: process.env.EMAIL_FROM || "test@example.com",
                    //The email to contact
                    to: _user.get("username"),
                    //Subject and text data
                    subject: 'Stickers Uploaded',
                    html: fs.readFileSync("./uploads/sticker_upload.html", "utf8")
                };

                mailgun.messages().send(data, function (error, body) {
                    if (error) {
                        console.log("BIG BIG ERROR: ", error.message);
                    }
                    else {

                        console.log("EMAIL SENT" + body);
                    }
                });

                statsRef.transaction(function (sticker) {
                    if (sticker) {
                        if (sticker.stickers) {
                            sticker.stickers++;
                        }
                    }

                    return sticker
                });


            }).then(function (stickers) {

                res.redirect("/pack/" + pack_id);

            }, function (error) {

                console.log("BIG BIG ERROR" + JSON.stringify(error));
                res.redirect("/pack/" + pack_id);

            })
        }, function (error) {
            console.log("BIG BIG ERROR" + error.message);
            res.redirect("/");
        });


    } else {

        res.redirect("/");

    }
});

module.exports = router;