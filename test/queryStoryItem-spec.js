const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of StoryItems contents', function (t) {
    t.plan(3);

    let query = new Parse.Query(_class.StoryItems);
    query.limit(1);
    query.first().then(function (newsletter) {

        contents = newsletter.get("contents");
        type = newsletter.get("type");
        storyId = newsletter.get("storyId");

        t.equal(typeof contents, "object");
        t.equal(typeof type, "number");
        t.equal(typeof storyId, "string");

        t.end();

    });

});
