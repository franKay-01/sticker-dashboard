const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of Artwork items', function (t) {
    t.plan(2);

    let query = new Parse.Query(_class.ArtWork);
    query.limit(1);
    query.first().then(function (artwork) {

        itemId = artwork.get("itemId");
        stickerId = artwork.get("stickerId");

        t.equal(typeof itemId, "string");
        t.equal(typeof stickerId, "string");

        t.end();

    });

});
