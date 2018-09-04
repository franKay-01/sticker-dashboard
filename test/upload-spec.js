let fs = require('fs');
const path = require('path');
const test = require('tape'); // assign the tape library to the variable "test"
const directoryPath = path.join('/app/public/assets/images');


let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

//passsing directoryPath and callback function
test('uploading items', function (t) {
    t.plan(1);

    let Test = new Parse.Object.extend("TestImages");
    let testImage = new Test();

    fs.readdir(directoryPath, function (err, files) {


        fs.readFile(files[0], 'base64', function (err, data) {
            if (err) {
                console.log(err);
            } else {
                iconFile = new Parse.File('icon', {base64: data});
                console.log("FILE " + JSON.stringify(iconFile));
                testImage.set("uri", iconFile);
                testImage.save().then(function (saved) {

                    console.log("SAVED " + JSON.stringify(saved));
                    t.equal(typeof saved.id, "string");
                    t.end();

                })
            }
        });
    });
});