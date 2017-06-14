// //import parse dependencies
// var Parse = require("parse");
// var ParseServer = require('parse-server').ParseServer;
Parse.initialize("cryptic-waters12");
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';

//input variables
var stName = $("#stname").val();
var lName = $("#lname").val();
var category = $("#category").val();

$(document).ready(function () {

    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows: false
        }
    );

    var newFile = $("#filein")[0];
    if(newFile.files.length > 0)
    {
        var file = newFile.files[0];
        var filename = file.name;
        var trimName = filename.substring(0, filename.length-4);

        stName.value = trimName;
        lName.value = trimName;
        $("#left-col").attr("src", file);

    //AJAX
    $("#form#tform").submit(function()
    {
        var formData = new FormData($(this)[0]);
        $.ajax({
            url: window.location = "/login",
            type: "POST",
            data: formData,
            async: false,
            cache: false,
            contentType: false,
            processData: false
        });
        return false;
    });
    //
    // var parseFile = new Parse.File(filename, file);
    // parseFile.save().then(function()
    // {
    //     var sticker = new StickerObject();
    //     sticker.set("stickerName",trimName);
    //     sticker.set("localName",trimName);
    //     sticker.set("uri",parseFile);
    //     sticker.set("category",["painful"]);
    //     sticker.set("stickerPhraseImage", "");
    //     sticker.save().then(function()
    //     {
    //         //file has been uploaded
    //         alert("image uploaded to parse");
    //     },
    //     function(problem)
    //     {
    //         //file was not uploaded
    //         console.error("Could not upload. " + problem);
    //     });
    // }, function(err)
    // {
    //     //parsefile was not saved
    //     console.error(err);
    // });
}

    console.log("current cookie: " + document.cookie);

});





