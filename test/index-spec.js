let assert = require('assert');
let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

describe('loggingMachine', function () {
    describe('log In', function () {
        it('logs into account', function () {
            let data = "";

            Parse.Cloud.run("login", {
                username: "dev@psyphertxt.com",
                password: "WonDerful1"
            }).then(user => {
                Parse.User.become(user.getSessionToken()).then((user) => {

                    data = user.getSessionToken().getUsername();

                }, error => {

                    data = "error";

                });
            });

            assert.equal(data, "dev@psyphertxt.com");

        });


        //  loggingMachine.login("dev@psyphertxt.com", "WonDerful1").then(function (result) {
        //     assert.equal(result, "dev@psyphertxt.com");
        // })
    });
});