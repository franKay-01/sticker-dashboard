//used to retrieve all stickers
require("./functions/getStickers");
require("./functions/messages");
require("./functions/api.v1");
require("./functions/api.dashboard.v1");


let StickerClass = "Stickers";
let CategoryClass = "Categories";
let StatsClass = "Stats";
let PacksClass = "Packs";


var _stickers = 0;
var _packs = 0;
var _categories = 0;

Parse.Cloud.define('login', function(req, res){

    let username = req.params.username;
    let password = req.params.password;

    Parse.User.logIn(username, password).then(function(user){
        res.success(user);
    },function(error){
        res.error(error);
    });

});

Parse.Cloud.define('signup', function(req, res){
    const NORMAL_USER = 0;

    let user = new Parse.User();
      user.set("name", req.params.name);
      user.set("username", req.params.email);
      user.set("email", req.params.email);
      user.set("password", req.params.password);
      user.set("type", NORMAL_USER);
      user.set("image_set", false);

      let Profile = new Parse.Object.extend("Profile");
      let profile = new Profile();

      user.signUp(
        { useMasterKey: true },
        {
          success: function(user) {
            profile.set("userId", user.id);
            profile.set("email", req.params.email);
            profile.set("gender", req.params.gender);

            profile.save().then(function() {
              res.success(user);
            });
          },
          error: function(user, error) {
            // Show the error message somewhere and let the user try again.
            res.error(error);

          }
        }
      );
})

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
