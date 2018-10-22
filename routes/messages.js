let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let moment = require('moment');

let _ = require('underscore');

module.exports = function (app) {

app.post('/message', function (req, res) {

    let token = req.cookies.token;
    let name = req.body.name;
    let email = req.body.email;
    let message = req.body.message;
    let source = parseInt(req.body.source);

    if (token) {

        util.getUser(token).then(function (sessionToken) {

            let Contact = new Parse.Object.extend(_class.Message);
            let contact = new Contact();

            contact.set("name", name);
            contact.set("email", email);
            contact.set("message", message);
            contact.set("type", source);
            contact.set("read", false);

            return contact.save();

        }).then(function () {

            res.redirect('/home');

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    }

});

app.get('/messages', function (req, res) {
    let token = req.cookies.token;
    let _messages = [];
    let _dates = [];
    let counter = 0;

    if (token) {

        util.getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Message).ascending().find();

        }).then(function (message) {

            _messages = message;

            _.each(message, function (date) {

                _dates[counter] = moment(date.get("createdAt")).format('LL');

                counter++;

            });

            res.render("pages/messages/messages", {
                contact: message,
                dates: _dates
            })

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    } else {
        res.redirect('/');

    }
});

app.get('/message/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        util.getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Message).equalTo("objectId", id).first();

        }).then(function (message) {

            res.render("pages/messages/single_message", {
                message: message
            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/home');
        });
    } else {
        res.redirect('/');

    }

});

app.get('/message/send', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        util.getUser(token).then(function (sessionToken) {

            res.render("pages/messages/post_message");

        }, function (error) {

            res.redirect('/home');

        })
    } else {

        res.redirect('/home');

    }
});

};