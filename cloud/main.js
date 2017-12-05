//used to retrieve all stickers
let Parse = require('parse-server');// .Parse;
//require("./functions/getStickers");

Parse.Cloud.job("sticker_number", function(request, status) {
     new Parse.Query("Stickers").count().then(function (result) {
        console.log("GOT THIS "+ JSON.stringify(result));
     });
});

// function name_test() {
//     console.log("I AM THE TEST");
// }
//
// name_test();