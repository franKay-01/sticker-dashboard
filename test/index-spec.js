let assert = require('assert');
let expect = require('chai').expect;
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

describe('loggingMachine', function () {
    describe('log In', function () {
        it('should start empty', function() {
            var arr = [];

            assert.equal(arr.length, 1);
        });

        it('logs into account', function () {

            new Parse.Query(_class.Authors).limit(1).find().then(function (data) {
                dat = data.length;
                console.log("LENGTH " + JSON.stringify(dat));
                // expect(dat).to.be.equal(2);
                assert.deepEqual(data.length, 3);
                // done();
            });
            // Parse.Cloud.run("login", {
            //     username: "dev@psyphertxt.com",
            //     password: "WonDerful1"
            // }).then(user => {
            //     Parse.User.become(user.getSessionToken()).then((user) => {
            //
            //         console.log("USER " + JSON.stringify(user));
            //         data = user.getUsername();
            //         let check = "dev@psyphertxt.co";
            //
            //         console.log("DATA INFO " + JSON.stringify(data));
            //         console.log("DATA INFO CHECK" + JSON.stringify(check));
            //         assert.deepStrictEqual(data, check);
            //         done();
            //
            //
            //     }, error => {
            //
            //         done(error);
            //         // return;
            //
            //
            //     });
            //
            //
            // });


        });
    });

});