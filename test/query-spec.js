let assert = require('assert');
var expect = require('chai').expect;
let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;
let _class = require('../cloud/modules/classNames');


describe('queringMachine', function () {
    describe('Query Packs', function () {
        it('Queries into Packs', function () {

            new Parse.Query(_class.Packs).equalTo("version", 1).first().then(function (data) {
                // assert.isObject(data);
                // assert.isString(data.get("name"));
                // assert.isNumber(data.get("version"));
                // assert.isString(data.get("description"));
                // assert.isBoolean(data.get("archived"));
                // assert.isString(data.get("userId"));
                // assert.isString(data.get("description"));
                // let preview = data.get("artwork").url();
                //
                // let extension = /[^.]+$/.exec(preview);
                // assert.equal(extension, "jpg" | "png");
                assert.equal(data.get("name"), 'Francis');

            });

        });

    });
});