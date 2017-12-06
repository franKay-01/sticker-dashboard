//used to retrieve all stickers
//require("./functions/getStickers");
let StickerClass = "Stickers";
let CategoryClass = "Categories";
let StatsClass = "Stats";
let PacksClass = "Packs";

Parse.Cloud.define("stickerNumber", function (req, res) {

    /*STICKERS=0
    PACKS=1
    CATEGORIES=2*/

    Parse.Promise.when(
        new Parse.Query(StickerClass).count(),
        new Parse.Query(PacksClass).count(),
        new Parse.Query(CategoryClass).count()).then(function (stickers, packs, categories) {

        //stickers .equalTo("objectId","R0ux0VzLB2")
        //packs .equalTo("objectId","pjTizUehrT")
        //categories equalTo("objectId","2NKxat6SPF")

        return Parse.Promise.when(
            new Parse.Query(StatsClass).equalTo("objectId", "R0ux0VzLB2").set("count", stickers).save(),
            new Parse.Query(PacksClass).equalTo("objectId", "pjTizUehrT").set("count", packs).save(),
            new Parse.Query(CategoryClass).equalTo("objectId", "2NKxat6SPF").set("count", categories).save());

    }).then(function (stickers, packs, categories) {
        req.success();
    }, function (error) {
        console.log("ERROR OCCURRED " + error.message);
    });

});
