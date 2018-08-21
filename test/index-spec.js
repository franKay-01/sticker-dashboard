let assert = require('assert');
let expect = require('chai').expect;

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

describe('loggingMachine', function () {
    describe('log In', function () {
        it('logs into account', function () {

            // new Parse.Query(_class.Authors).limit(1).find().then(function (data) {
            //
            //     dat = data.length;
            //     assert.equal(dat, 1);
            //
            // });
            Parse.Cloud.run("login", {
                username: "dev@psyphertxt.com",
                password: "WonDerful1"
            }).then(user => {
                Parse.User.become(user.getSessionToken()).then((user) => {

                    data = user.getUsername();
                    let check = "dev@psyphertxt.co";
                    console.log("DATA INFO " + data);
                    console.log("DATA INFO CHECK" + check);
                    assert.deepStrictEqual(data, check);
                    done();


                }, error => {

                    done(error);
                    // return;


                });


            });


        });
    });

});