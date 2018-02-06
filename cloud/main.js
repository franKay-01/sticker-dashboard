//used to retrieve all stickers
//require("./functions/getStickers");
let StickerClass = "Stickers";
let CategoryClass = "Categories";
let StatsClass = "Stats";
let PacksClass = "Packs";
var _stickers = 0;
var _packs = 0;
var _categories = 0;

var path = require('path');
var bodyParser = require('body-parser');

// This imports the Router that uses the template engine
var index = require('./routers/index');

// Sets the template engine as EJS
app.set('view engine', 'ejs');

// This defines that the 'views' folder contains the templates
app.set('views', path.join(__dirname, '/views'));

// These options are necessary to
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// This bind the Router to the / route
app.use('/', index);

Parse.Cloud.define("stickerNumber", function (req, res) {

    console.log("USER________"+JSON.stringify(req.user));

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
