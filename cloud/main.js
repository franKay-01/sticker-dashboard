//used to retrieve all stickers
//require("./functions/getStickers");

Parse.Cloud.job("stickerNumber", function(request, status) {
     new Parse.Query("Stickers").count().then(function (result) {
        console.log("GOT THIS "+ JSON.stringify(result));
     });
});
