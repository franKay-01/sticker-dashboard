const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of Advert Images items', function (t) {
    t.plan(4);

    let query = new Parse.Query(_class.Adverts);
    query.limit(1);
    query.first().then(function (advert) {

        title = advert.get("title");
        description = advert.get("description");
        userId = advert.get("userId");
        buttonAction = advert.get("buttonAction");

        t.equal(typeof title, "string");
        t.equal(typeof description, "string");
        t.equal(typeof userId, "string");
        t.equal(typeof buttonAction, "string");

        t.end();

    });

});
