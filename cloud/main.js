//used to retrieve all stickers
//require("./functions/getStickers");
let StickerCLass = "Stickers";
let CategoryClass ="Categories";
let StatsClass = "Stats";

Parse.Cloud.define("stickerNumber", function(request, status) {

    Parse.Promise.when(
        new Parse.Query(StickerCLass).count(),
        new Parse.Query(CategoryClass).count()).then(function (stickers, category) {

        var Stats = new Parse.Object.extend(StatsClass);
        var stats = new Stats();
            stats.set("stickers", stickers);
            stats.set("categories", category);
            return stats.save();
        }).then(function () {
            console.log("STATS UPDATED");
        }), function (error) {
            console.log("ERROR OCCURRED " + error.message);
        }

});
