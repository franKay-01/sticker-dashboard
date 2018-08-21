let assert = require('assert');
let expect = require('chai').expect;
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

describe('loggingMachine', function () {
    describe('log In', function () {
        it('logs into account', function () {
            let dat = 0;
            let data = "";

            new Parse.Query(_class.Authors).limit(1).find().then(function (data) {

                dat = data.length;
                assert.equal(dat, 9);

            });

            // Parse.Cloud.run("login", {
            //     username: "dev@psyphertxt.com",
            //     password: "WonDerful1"
            // }).then(user => {
            //     Parse.User.become(user.getSessionToken()).then((user) => {
            //
            //         data = user.getSessionToken().getUsername();
            //         assert.equal(data, "dev@psyphertxt.com", 'element is equal');
            //
            //         // assert.equal(data, "dev@psyphertxt.co");
            //         done();
            //         // expect(data).to.equal("dev@psyphertxt.co");
            //
            //     }, error => {
            //
            //         done(error);
            //         // return;
            //
            //
            //     });
            // });


        });
    });

});