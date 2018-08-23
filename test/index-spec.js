const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of pack items', function (t) {
    t.plan(6);

    let query = new Parse.Query(_class.Packs);
    query.limit(1);
    query.first().then(function (pack) {

        name = pack.get("name");
        version = pack.get("version");
        description = pack.get("description");
        archived = pack.get("archived");
        userId = pack.get("userId");
        preview = pack.get("preview");

        t.equal(typeof name, "string");
        t.equal(typeof version, "number");
        t.equal(typeof description, "string");
        t.equal(typeof archived, "boolean");
        t.equal(typeof userId, "string");
        t.equal(typeof preview, "object");
        t.end();

    });

});
