let _class = require("../cloud/modules/classNames");
let type = require("../cloud/modules/type");
let util = require('../cloud/modules/util');

module.exports = function (app) {

    app.get('/newsletter/story/:storyId', function (req, res) {

        let storyId = req.params.storyId;
        let _story;
        let colors;

        Parse.Promise.when(
            new Parse.Query(_class.Stories).equalTo("objectId", storyId).first(),
            new Parse.Query(_class.ArtWork).equalTo("itemId", storyId).first()
        ).then(function (story, sticker) {

            _story = story;

            colors = story.get("color");

            if (!colors) {
                //use system default
                colors = type.DEFAULT.colors;
            }

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first(),
                new Parse.Query(_class.StoryItems).equalTo("storyId", _story.id).find()
            )

        }).then(function (sticker, storyItems) {

            res.render("pages/newsletter/newsletter", {
                story: _story,
                sticker: sticker,
                colors: colors,
                storyItems: storyItems,
                type: type
            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/stories');
        })

    });

};