let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let _ = require('underscore');
let type = require('../cloud/modules/type');
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

app.get('/stories', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        let _user = {};
        let art = {};
        let _story = [];
        let _allPack = [];
        let artWork = [];
        let _allArtwork = [];
        let combined = [];
        let _latest = "";

        util.getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Stories).equalTo("userId", _user.id).descending("createdAt").find(),
                new Parse.Query(_class.Packs).equalTo("userId", _user.id).find(),
                new Parse.Query(_class.ArtWork).find(),
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first()
            );


        }).then(function (story, allPack, artworks, latest) {

            _story = story;
            _allPack = allPack;
            _allArtwork = artworks;

            if (latest) {
                _latest = latest;
            }


            _.each(artworks, function (artwork) {

                artWork.push(artwork.get("stickerId"));

            });

            return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find();

        }).then(function (stickers) {

            _.each(_allArtwork, function (artworks) {

                _.each(stickers, function (sticker) {

                    if (artworks.get("stickerId") === sticker.id) {

                        combined.push({
                            story: artworks.get("itemId"),
                            image: sticker.get("uri").url()
                        });
                    }
                })
            });

            res.render("pages/stories/stories", {
                story: _story,
                allPacks: _allPack,
                arts: combined,
                latest: _latest,
                type: type
            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    } else {
        res.redirect('/');

    }
});
