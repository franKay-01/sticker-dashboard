let fs = require('fs');
const path = require('path');
const test = require('tape'); // assign the tape library to the variable "test"
let _class = require('../cloud/modules/classNames');
const directoryPath = path.join(__dirname, '/public/assets/images');


let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

//passsing directoryPath and callback function
test('check typeOf of Pack items', function (t) {
    t.plan(1);

    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        console.log("FILE No. " + files[0]);
        t.equal(typeof files[0], "object");
        t.end();

    });
});