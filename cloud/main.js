//used to retrieve all stickers
//require("./functions/getStickers");

Parse.Cloud.define("stickerNumber", function(request, status) {
    var user = request.params.username;

     new Parse.Query("Stickers").count().then(function (result) {
        console.log("GOT THIS "+ JSON.stringify(result));
        console.log("USER DETAILS " + JSON.stringify(user));
     });
});
