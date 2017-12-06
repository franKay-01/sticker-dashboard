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
        new Parse.Query(CategoryClass).count())
        .then(function (stickers, packs, categories) {

            if (stickers.length && packs.length && categories.length) {
                return Parse.Promise.when(
                    new Parse.Query(StatsClass).equalTo("objectId", "R0ux0VzLB2").first(),
                    new Parse.Query(StatsClass).equalTo("objectId", "pjTizUehrT").first(),
                    new Parse.Query(StatsClass).equalTo("objectId", "2NKxat6SPF").first());
            }

            req.error()

        }).then(function (sticker, pack, category) {

        if (sticker && pack && category) {

            return Parse.Promise.when(
                sticker.set("count", sticker).save(),
                pack.set("count", packs).save(),
                category.set("count", categories).save());

        }

        req.error();

    }).then(function () {
        req.success();

    }, function (error) {
        console.log("ERROR OCCURRED " + error.message);
    });

});
