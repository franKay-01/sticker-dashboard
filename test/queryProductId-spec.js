const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of ProductID items', function (t) {
    t.plan(8);

    let query = new Parse.Query(_class.Product);
    query.limit(1);
    query.first().then(function (newsletter) {

        productID = newsletter.get("productId");
        published = newsletter.get("published");
        userId = newsletter.get("userId");
        name = newsletter.get("name");
        description = newsletter.get("description");
        price = newsletter.get("price");
        preview = newsletter.get("preview");
        artwork = newsletter.get("artwork");

        t.equal(typeof productID, "object");
        t.equal(typeof published, "boolean");
        t.equal(typeof userId, "string");
        t.equal(typeof name, "string");
        t.equal(typeof description, "string");
        t.equal(typeof price, "object");
        t.equal(typeof preview, "object");
        t.equal(typeof artwork, "object");

        t.end();

    });

});
