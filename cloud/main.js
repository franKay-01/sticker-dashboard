//used to retrieve all stickers
//require("./functions/getStickers");
let StickerClass = "Stickers";
let CategoryClass = "Categories";
let StatsClass = "Stats";
let PacksClass = "Packs";
var _stickers = 0;
var _packs = 0;
var _categories = 0;

Parse.Cloud.define("stickerNumber", function (req, res) {

    /*STICKERS=0
    PACKS=1
    CATEGORIES=2*/

    Parse.Promise.when(
        new Parse.Query(StickerClass).count(),
        new Parse.Query(PacksClass).count(),
        new Parse.Query(CategoryClass).count())
        .then(function (stickers, packs, categories) {
            _stickers = stickers;
            _packs = packs;
            _categories = categories;

            return Parse.Promise.when(
                new Parse.Query(StatsClass).equalTo("objectId", "R0ux0VzLB2").first(),
                new Parse.Query(StatsClass).equalTo("objectId", "pjTizUehrT").first(),
                new Parse.Query(StatsClass).equalTo("objectId", "2NKxat6SPF").first());


        }).then(function (sticker, pack, category) {

        return Parse.Promise.when(
            sticker.set("count", _stickers).save(),
            pack.set("count", _packs).save(),
            category.set("count", _categories).save());


    }).then(function () {
        req.success();

    }, function (error) {
        console.log("ERROR OCCURRED " + error.message);
    });

});

Parse.Cloud.define("verification", function (req, res) {
    console.log("USER PASSED " + req.params.user);
    // var query = new Parse.Query("User");
     var query = new Parse.Query("User");

    query.equalTo("email", req.params.user);

    query.find({sessionToken: req.params.token}).then(function (userId) {

        console.log("USER " + JSON.stringify(userId));
        console.log("VERIFICATION CHANGED");
        userId.set("emailVerified", true);
        console.log("VERIFICATION CHANGED 1");

        // return userId.save({sessionToken: req.params.token});

        userId.save({sessionToken: req.params.token}, {

            success: function (result) {
                console.log("VERIFICATION CHANGED 2");
                req.success(result);
            }
        });
        // }).then(function () {
        //     console.log("VERIFICATION CHANGED 2");
        //     req.success();
        //
    }, function (error) {
        req.error("an error occurred");
    });

});
