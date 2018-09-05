const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of History items', function (t) {
    t.plan(2);

    let query = new Parse.Query(_class.History);
    query.limit(1);
    query.first().then(function (history) {

        type = history.get("type");
        itemId = history.get("itemId");

        t.equal(typeof type, "number");
        t.equal(typeof itemId, "string");

        t.end();

    });

});
