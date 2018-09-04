const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of Sticker items', function (t) {
    t.plan(6);

    let query = new Parse.Query(_class.Stickers);
    query.limit(1);
    query.first().then(function (sticker) {

        name = sticker.get("name");
        preview = sticker.get("preview");
        uri = sticker.get("uri");
        sold = sticker.get("sold");
        category = sticker.get("categories");
        productID = sticker.get("productId");

        t.equal(typeof name, "string");
        t.equal(typeof preview, "object");
        t.equal(typeof uri, "object");
        t.equal(typeof sold, "boolean");
        t.equal(typeof category, "object");
        t.equal(typeof productID, "string");
        t.end();

    });

});
