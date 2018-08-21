let assert = require('assert');
var expect = require('chai').expect;
let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;
let _class = require('../cloud/modules/classNames');


describe('queringMachine', function () {
    describe('Query Packs', function () {
        it('Queries into Packs', function () {

            let name = "";
            let verison = 0;
            let description = "";
            let archive = false;
            let userId = "";

            new Parse.Query(_class.Packs).equalTo("version", 1).first().then(function (data) {
                name = data.get("name");
                verison = data.get("version");
                description = data.get("description");
                archive = data.get("archived");
                userId = data.get("userId");

                assert.isString(name, 'is(not) string');
                assert.isNumber(verison, 'is(not) number');
                assert.isString(description, 'is(not) string');
                assert.isBoolean(archive, 'is(not) boolean');
                assert.isString(userId, 'is(not) string');
                let preview = data.get("artwork").url();

                let extension = /[^.]+$/.exec(preview);
                assert.equal(extension, "jpg" | "png");

                console.log("DATA " + name +  " " + version);

            });

        });

    });
});