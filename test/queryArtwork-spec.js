const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of Advert items', function (t) {
    t.plan(5);

    let query = new Parse.Query(_class.AdvertImages);
    query.limit(1);
    query.first().then(function (advertImages) {

        uri = advertImages.get("uri");
        name = advertImages.get("name");
        links = advertImages.get("links");
        type = advertImages.get("type");
        advertId = advertImages.get("advertId");

        t.equal(typeof uri, "object");
        t.equal(typeof name, "string");
        t.equal(typeof links, "string");
        t.equal(typeof type, "number");
        t.equal(typeof advertId, "string");

        t.end();

    });

});
