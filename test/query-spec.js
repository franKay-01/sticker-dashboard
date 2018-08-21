let assert = require('assert');
let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;
let _class = require('../cloud/modules/classNames');


describe('queringMachine', function () {
    describe('Query Packs', function () {
        it('Queries into Packs', function () {

            new Parse.Query(_class.Packs).first().then(function (data) {
                assert.isObject(data);
                assert.isString(data.get("name"));
                assert.isNumber(data.get("version"));
                assert.isString(data.get("description"));
                assert.isBoolean(data.get("archived"));
                assert.isNumber(data.get("userId"));
                assert.isString(data.get("description"));
                let preview = data.get("artwork").url();

                let extension = /[^.]+$/.exec(preview);
                assert.equal(extension, "jpg" | "png");


            });

        });

    });
});