let fs = require('fs');
const path = require('path');
const test = require('tape'); // assign the tape library to the variable "test"
let util = require('../cloud/modules/util');
const directoryPath = path.join('/app/public/assets/images');


let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

//passsing directoryPath and callback function
test('uploading items', function (t) {
    t.plan(1);

    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        let Test = new Parse.Object.extend("TestImages");
        let testImage = new Test();

        let originalName = file.originalname;
        let stickerName = originalName.replace(util.SPECIAL_CHARACTERS, '').substring(0, originalName.length - 4);

        let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

        //create our parse file
        let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
        testImage.set("name", stickerName);
        testImage.set("localName", stickerName);
        testImage.set("uri", parseFile);

        test.save().then(function (image) {
            let imageId = image.id;
            t.equal(typeof imageId, "number");
            t.end();
        })
    });
});