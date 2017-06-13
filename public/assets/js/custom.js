// //import parse dependencies
// var Parse = require("parse");
// var ParseServer = require('parse-server').ParseServer;
Parse.initialize("cryptic-waters12");
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';

//input variables
var stName = $("#stname");
var lName = $("#lname");
var category = $("#category");

$(document).ready(function () {

    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows: false
        }
    );

    var StickerObject = new Parse.Object.extend("Stickers");
var newFile = $("#filein")[0];
if(newFile.files.length > 0)
{
    var file = newFile.files[0];
    var filename = file.name;
    var trimName = filename.substring(0, filename.length-4);

    stName.value = trimName;
    lName.value = trimName;

    var parseFile = new Parse.File(filename, file);
    parseFile.save().then(function()
    {
        //success
        $("#left-col").attr("src", parseFile.url());

        var sticker = new StickerObject();
        sticker.set("stickerName",trimName);
        sticker.set("localName",trimName);
        sticker.set("uri",parseFile);
        sticker.set("category",["painful"]);
        sticker.set("stickerPhraseImage", "");
        sticker.save().then(function()
        {
            //file has been uploaded
            alert("image uploaded to parse");
        },
        function(problem)
        {
            //file was not uploaded
            console.error("Could not upload. " + problem);
        });
    }, function(err)
    {
        //parsefile was not saved
        console.error(err);
    });
}



    console.log("current cookie: " + document.cookie);


});





