let _class = require("../cloud/modules/classNames");
let type = require("../cloud/modules/type");
let Mailgun = require('mailgun-js');

let fs = require('fs');
let ejs = require('ejs');

const SERVER_URL = process.env.SERVER_URL.replace('parse', '');
let mailgun = new Mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});

module.exports = function (app) {

    app.get('/newsletter/episode/:episodeId', function (req, res) {

        let episodeId = req.params.episodeId;
        let _episode;
        let colors;

        Parse.Promise.when(

            new Parse.Query(_class.Episodes).equalTo("objectId", episodeId).first(),

        ).then(function (episode) {

            _episode = episode;

            return Parse.Promise.when(
                new Parse.Query(_class.StoryItems).equalTo("storyId", _episode.id).find(),
                new Parse.Query(_class.Stories).equalTo("objectId", _episode.get("storyId")).first(),
                new Parse.Query(_class.ArtWork).equalTo("itemId", _episode.get("storyId")).first()
            )

        }).then(function (storyItems, story, sticker ) {

            colors = story.get("color");

            if (!colors) {
                //use system default
                colors = type.DEFAULT.colors;
            }

            return new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first()

        }).then(function (sticker) {

            res.render("pages/newsletter/newsletter", {
                story: _episode,
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

    app.post('/newsletter/email', function (req, res) {

        let email = req.body.email;

        function subscriptionTemplate(id) {

            let file = fs.readFileSync('./views/pages/newsletter/newsletter_email.ejs', 'ascii');

            return ejs.render(file, {id: id, serverURL: SERVER_URL});
        }

        if (email) {

            new Parse.Query(_class.NewsLetter).equalTo("email", email).first().then(function (newsletter) {

                if (newsletter) {
                    if (newsletter.get("subscribe") === false) {

                        return subscriptionTemplate(newsletter.id);

                        // res.redirect('/newsletter/update/' + newsletter.id);

                    } else if (newsletter.get("subscribe") === true) {

                        res.render("pages/newsletter/newsletter_already_subscribed");

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

                //TODO update to use promises
                mailgun.messages().send(data, function (error, body) {
                    if (error) {
                        console.log("BIG BIG ERROR: ", error.message);
                    }
                    else {

                        console.log("EMAIL SENT" + body);
                    }
                });

                res.render("pages/newsletter/newsletter_subscribe");

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('')
            })


        }
    });

    app.get('/newsletter/update/:id', function (req, res) {

        let id = req.params.id;

        return new Parse.Query(_class.NewsLetter).equalTo("objectId", id).first().then(function (newsletter) {

            newsletter.set("subscribe", true);

            return newsletter.save();

        }).then(function () {

            // TODO display type of update before changing subscription to true
            res.render("pages/newsletter/newsletter_updates");

        }, function (error) {

            console.log("ERROR " + error.message);

        })
    });

    app.get('/newsletter/send/story', function (req, res) {

        let _newsletters;
        let _story;
        let emails = [];
        let colors;

        return Parse.Promise.when(
            new Parse.Query(_class.NewsLetter).equalTo("subscribe", true).find(),
            new Parse.Query(_class.Stories).equalTo("objectId", 'VcTBweB2Mz').first(),
            new Parse.Query(_class.ArtWork).equalTo("itemId", 'VcTBweB2Mz').first()
        ).then(function (newsletters, story, sticker) {

            console.log("COLLECTED ALL DATA");

            _newsletters = newsletters;
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

            _.each(_newsletters, function (newsletter) {

                emails.push(newsletter.get("email"));

            });

            let file = fs.readFileSync('./views/pages/newsletter/newsletter_story.ejs', 'ascii');

            return ejs.render(file, {
                story: _story,
                sticker: sticker,
                colors: colors,
                storyItems: storyItems
            });


        }).then(function (htmlString) {

            return mailgun.messages().send({
                from: process.env.EMAIL_FROM || "test@example.com",
                to: emails.toString(),
                subject: _story.get("title"),
                html: htmlString

            });

        }).then(() => {

            res.send("EMAIL SENT");

        }, function (error) {

            console.log("ERROR " + error.message);

        })
    });


};