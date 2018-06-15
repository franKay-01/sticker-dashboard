let express = require('express');
let router = express.Router();
let _class = require("../cloud/modules/classNames");
let type = require("../cloud/modules/type");

// router.use(function timeLog(req, res, next) {
//     next();
// });

router.get('/newsletter/:id', function (req, res) {

    //delete all items in the database
    let storyId = req.params.id;
    let _story;
    let colors;

    Parse.Promise.when(
        new Parse.Query(_class.Story).equalTo("objectId", storyId).first(),
        new Parse.Query(_class.ArtWork).equalTo("object_id", storyId).first()
    ).then(function (story, sticker) {

        _story = story;

        colors = story.get("color");
        if (!colors) {
            //use system default
            colors = type.DEFAULT.color;
        }

        return Parse.Promise.when(
            new Parse.Query(_class.Sticker).equalTo("objectId", sticker.get("sticker")).first(),
            new Parse.Query(_class.StoryItem).equalTo("story_id", _story.id).find()
        )

    }).then(function (sticker, storyItems) {

        res.render("pages/newsletter", {
            story: _story,
            sticker: sticker,
            colors: colors,
            storyItems: storyItems
        });

    }, function (error) {
        console.log("ERROR " + error.message);
        res.redirect('/stories');
    })

});

router.post('/newsletter/email', function (req, res) {

    let email = req.body.email;

    function subscriptionTemplate(id) {

        let file = fs.readFileSync('./views/pages/newsletter_email.ejs', 'ascii');

        return ejs.render(file, {id: id, serverURL: SERVER_URL});
    }

    if (email) {

        new Parse.Query(_class.NewsLetter).equalTo("email", email).first().then(function (newsletter) {

            if (newsletter) {
                if (newsletter.get("subscribe") === false) {

                    return subscriptionTemplate(newsletter.id);

                    // res.redirect('/newsletter/update/' + newsletter.id);

                } else if (newsletter.get("subscribe") === true) {

                    res.render("pages/newsletter_already_subscribed");

                }
            } else {
                let NewsLetter = new Parse.Object.extend(_class.NewsLetter);
                let newsletter = new NewsLetter();

                newsletter.set("email", email);
                newsletter.set("subscribe", false);

                return newsletter.save();
            }
        }).then(function (newsletter) {

            if (newsletter.id) {

                return subscriptionTemplate(newsletter.id);

            }

            return newsletter;

        }).then(function (htmlString) {

            //TODO create a mailgun function and expose changing params
            let mailgun = new Mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});
            let data = {
                //Specify email data
                from: process.env.EMAIL_FROM || "test@example.com",
                //The email to contact
                to: email,
                //Subject and text data
                subject: 'G-Stickers Newsletter Subscription',
                // html: fs.readFileSync("./uploads/newsletter_email.ejs", "utf8"),
                html: htmlString

            };

            //TODO use promises
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    console.log("BIG BIG ERROR: ", error.message);
                }
                else {

                    console.log("EMAIL SENT" + body);
                }
            });

            res.render("pages/newsletter_subscribe");

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('')
        })


    }
});

router.get('/newsletter/update/:id', function (req, res) {

    let id = req.params.id;

    return new Parse.Query(_class.NewsLetter).equalTo("objectId", id).first().then(function (newsletter) {

        newsletter.set("subscribe", true);

        return newsletter.save();

    }).then(function () {

        // TODO display type of update before changing subscription to true
        res.render("pages/newsletter_updates");

    }, function (error) {

        console.log("ERROR " + error.message);

    })
});


router.get('/newsletter/update', function (req, res) {

    let _newsletters;
    let _story;
    let emails = [];
    let colors;

    return Parse.Promise.when(
        new Parse.Query(NewsLetter).equalTo("subscribe", true).find(),
        new Parse.Query(Story).equalTo("objectId", 'qRNKDvid5z').first(),
        new Parse.Query(ArtWork).equalTo("object_id", 'qRNKDvid5z').first()
    ).then(function (newsletters, story, sticker) {

        console.log("COLLECTED ALL DATA");

        _newsletters = newsletters;
        _story = story;

        colors = story.get("color");
        if (colors) {
            colors = story.get("color");
        } else {
            //use system default
            colors = type.DEFAULT.color;
        }

        return Parse.Promise.when(
            new Parse.Query(Sticker).equalTo("objectId", sticker.get("sticker")).first(),
            new Parse.Query(StoryItem).equalTo("story_id", _story.id).find()
        )

    }).then(function (sticker, storyItems) {

        console.log("COLLECTED ALL DATA 2");

        _.each(_newsletters, function (newsletter) {

            emails.push(newsletter.get("email"));

            let file = fs.readFileSync('./views/pages/newsletter_story.ejs', 'ascii');

            return ejs.render(file, {
                story: _story,
                sticker: sticker,
                colors: colors,
                storyItems: storyItems
            });

        });


    }).then(function (htmlString) {

        console.log("COLLECTED ALL DATA 3");

        let mailgun = new Mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});
        let data = {
            //Specify email data
            from: process.env.EMAIL_FROM || "test@example.com",
            //The email to contact
            to: emails,
            //Subject and text data
            subject: 'G-Stickers Newsletter Subscription',
            // html: fs.readFileSync("./uploads/newsletter_email.ejs", "utf8"),
            html: htmlString

        };

        mailgun.messages().send(data, function (error, body) {
            if (error) {
                console.log("BIG BIG ERROR: ", error.message);
            }
            else {

                console.log("EMAIL SENT" + body);
            }
        });
        // TODO display type of update before changing subscription to true
        res.send("EMAIL SENT");
    }, function (error) {

        console.log("ERROR " + error.message);

    })
});

module.exports = router;