let assert = require('assert');
let expect = require('chai').expect;
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

let name = "";


function resultAuthor(name) {
    console.log("RESULT FROM RESULTAUTHOR " + name);
    return name
}
function findAuthor(email) {

    new Parse.Query(_class.Authors).equalTo("email", email).first().then(function (data) {
        console.log("LOG FROM FUNCTION " + data.get("name"));
        name = data.get("name");
        return resultAuthor(name);
    });

    // return name;
}

describe('loggingMachine', function () {
    describe('log In', function () {
        let name = findAuthor("michael@info.com");

        this.timeout(30000);

        it('should start empty', function () {
            var arr = [];

            assert.equal(arr.length, 1);
        });

        it('logs into account', function () {
            // assert.equal(result.length, 3);

            console.log("NAME " + name);
            assert.deepEqual(name, "Michael bay");
            done();

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