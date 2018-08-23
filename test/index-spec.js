let assert = require('assert');
let expect = require('chai').expect;
const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

test('check if name is a string', function (t) {
    let email = "michael@info.com";
    t.plan(2);

    let query = new Parse.Query(_class.Authors);
    query.equalTo("email", email);
    query.first().then(function (author) {

        console.log("AUTHER NAME " + author.get("name"));
        name = author.get("name");
        // assert.typeOf(author, '');
        t.equal(typeof name, "string");

        t.equal("Michael bay", name);
        t.end();

    });
    // t.equal(3, sum(1, 2)); // make this test pass by completing the add function!
    // t.end();
});

// describe('object checking', function () {
//     it('should be object', function (done) {
//
//         let email = "michael@info.com";
//
//         let query = new Parse.Query(_class.Authors);
//         query.equalTo("email", email);
//         query.first().then(function (author) {
//
//             console.log("AUTHER NAME " + author.get("name"));
//             name = author.get("name");
//             // expect(author).to.be.an('array', 'nooo why fail??');
//             // assert.typeOf(author, '');
//             expect(name).to.be.an('object');
//             done()
//         })
//
//
//     });
//
// });