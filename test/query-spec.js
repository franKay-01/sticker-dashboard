let assert = require('assert');
let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;
let _class = require('../cloud/modules/classNames');

describe('Query Packs', function () {
    it('Queries into Packs', function () {

        let dat = 0;
        let name = "";
        let verison = 0;
        let description = "";
        let archive = false;
        let userId = "";

        let query = new Parse.Query(_class.Packs);
        query.equalTo("version", 1).limit(1).find().then(function (data) {
            name = data[0].get("name");
            verison = data[0].get("version");
            description = data[0].get("description");
            archive = data[0].get("archived");
            userId = data[0].get("userId");

            assert.isString(name, 'is(not) string');
            assert.isNumber(verison, 'is(not) number');
            assert.isString(description, 'is(not) string');
            assert.isBoolean(archive, 'is(not) boolean');
            assert.isString(userId, 'is(not) string');
            let preview = data[0].get("artwork").url();

            let extension = /[^.]+$/.exec(preview);
            assert.equal(extension, "jpg" || "png");

            dat = data.length;
            assert.equal(dat, 2);
            done();

        });

    });

});