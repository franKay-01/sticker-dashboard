const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of Newsletter items', function (t) {
    t.plan(2);

    let query = new Parse.Query(_class.NewsLetter);
    query.limit(1);
    query.first().then(function (newsletter) {

        email = newsletter.get("email");
        subscribe = newsletter.get("subscribe");

        t.equal(typeof email, "string");
        t.equal(typeof subscribe, "boolean");

        t.end();

    });

});
