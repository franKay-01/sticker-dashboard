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
                assert.isString(data.get("name"), 'order placed');
                assert.isNumber(data.get("version"), 0);
                assert.isString(data.get("description"), 'order placed');
                assert.isBoolean(data.get("archived"), 'order placed');
                assert.isString(data.get("userId"), 'order placed');
                assert.isString(data.get("description"), 'order placed');
                let preview = data.get("artwork").url();

                let extension = /[^.]+$/.exec(preview);
                assert.equal(extension, "jpg" | "png");


            });

        });

    });
});