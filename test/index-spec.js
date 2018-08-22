let assert = require('assert');
let expect = require('chai').expect;
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;


describe('loggingMachine', function () {
    describe('log In', function () {
        it('should be object', function () {

            let email = "michael@info.com";

            let query = new Parse.Query(_class.Authors);
            query.equalTo("email", email);
            query.first().then(function (author) {

                console.log("AUTHOR " + JSON.stringify(author));
                expect(author).to.be.an('array', 'nooo why fail??');

            })

        });
        //
        // it('should start empty', function () {
        //     var arr = [];
        //
        //     assert.equal(arr.length, 1);
        // });
        //
    });

});