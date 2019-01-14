const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of Episode items', function (t) {
    t.plan(4);

    let query = new Parse.Query(_class.Episodes);
    query.limit(1);
    query.first().then(function (episode) {

        title = episode.get("title");
        sold = episode.get("sold");
        product = episode.get("productId");
        order = episode.get("order");

        t.equal(typeof title, "string");
        t.equal(typeof sold, "boolean");
        t.equal(typeof product, "string");
        t.equal(typeof order, "number");

        t.end();

    });

});
