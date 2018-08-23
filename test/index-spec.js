let assert = require('assert');
let expect = require('chai').expect;
const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');

let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;



function sum (a, b) {
    // your code to make the test pass goes here ...
    return a + b;
}

test('sum should return the addition of two numbers', function (t) {
    let email = "michael@info.com";

                let query = new Parse.Query(_class.Authors);
                query.equalTo("email", email);
                query.first().then(function (author) {

                    console.log("AUTHER NAME " + author.get("name"));
                    name = author.get("name");
                    // expect(author).to.be.an('array', 'nooo why fail??');
                    // assert.typeOf(author, '');
                    t.equal("Michael bay", name);
                    t.end();

                });
    // t.equal(3, sum(1, 2)); // make this test pass by completing the add function!
    // t.end();
});
// describe('loggingMachine', function () {
//     describe('log In', function () {
//         it('should be object', function (done) {
//
//             new Promise(async (resolve, reject) => {
//
//                 let email = "michael@info.com";
//
//                 let query = new Parse.Query(_class.Authors);
//                 query.equalTo("email", email);
//                 query.first().then(function (author) {
//
//                     console.log("AUTHER NAME " + author.get("name"));
//                     name = author.get("name");
//                     // expect(author).to.be.an('array', 'nooo why fail??');
//                     // assert.typeOf(author, '');
//                     expect(name).to.be.an('object');
//                 })
//             });
//             done();
//
//         });
//
//         it('should start empty', function () {
//             var arr = [];
//
//             assert.equal(arr.length, 1);
//         });
//
//     });
//
// });