const test = require('tape'); // assign the tape library to the variable "test"

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('log into the system', function (t) {
    t.plan(1);

    Parse.Cloud.run("login", {
        username: 'dev@psyphertxt.com',
        password: 'Wonderful1'
    }).then(user => {

        Parse.User.become(user.getSessionToken()).then((user) => {
            let _user = user.get("user");
            let type = _user.get("type");
            t.equal(typeof type, "number");
            t.end();

        });

    })

});
