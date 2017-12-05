//used to retrieve all stickers
//  let Parse = require("parse/node").Parse;
var Parse = require('parse/node');

//require("./functions/getStickers");

Parse.Cloud.job("sticker_number", function(request, status) {
     new Parse.Query("Stickers").count().then(function (result) {
        console.log("GOT THIS "+ JSON.stringify(result));
     });
});