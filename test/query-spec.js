const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check typeOf of Story items', function (t) {
    t.plan(5);

    let query = new Parse.Query(_class.Stories);
    query.limit(1);
    query.first().then(function (story) {

        title = story.get("title");
        keywords = story.get("keywords");
        published = story.get("published");
        color = story.get("color");
        storyType = story.get("storyType");

        t.equal(typeof title, "string");
        t.equal(typeof keywords, "array");
        t.equal(typeof published, "boolean");
        t.equal(typeof color, "array");
        t.equal(typeof storyType, "number");
        t.end();

    });

});
