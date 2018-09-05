const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of Links items', function (t) {
    t.plan(3);

    let query = new Parse.Query(_class.Links);
    query.limit(1);
    query.first().then(function (links) {

        type = links.get("type");
        link = links.get("link");
        itemId = links.get("itemId");

        t.equal(typeof type, "number");
        t.equal(typeof link, "string");
        t.equal(typeof itemId, "string");

        t.end();

    });

});
