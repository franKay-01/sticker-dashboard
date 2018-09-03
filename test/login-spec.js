const test = require('tape'); // assign the tape library to the variable "test"

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('log into the system', function (t) {

    t.plan(1);

    Parse.User.logIn(process.env.TEST_EMAIL, process.env.TEST_PASSWORD).then(function (user) {
        console.log("USER " + user);
        let type = user.get("type");
        t.equal(typeof type, "number");
        t.end();

    })

});
