let assert = require('assert');
let expect = require('chai').expect;

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

function delayedMap(array, transform, callback) {
    setTimeout(function() {
        // callback(array.map(transform));
    }, 100);
}

describe('loggingMachine', function () {
    describe('log In', function () {

        it('eventually returns the results', function() {
            var input = [1, 2, 3];
            var transform = function(x) { return x * 2; };

            delayedMap(input, transform, function(result) {
                assert.deepEqual(result, [2, 4, 6]);
                done();
            });
        });

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

                    data = user.getSessionToken().getUsername();
                    console.log("DATA INFO " + data);
                    assert.deepEqual(data, "dev@psyphertxt.co");

                    // assert.equal(data, "dev@psyphertxt.co");
                    done();
                    // expect(data).to.equal("dev@psyphertxt.co");

                }, error => {

                    done(error);
                    // return;


                });
            });


        });
    });

});