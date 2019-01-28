let util = require("../modules/util");
let helper = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');
let create = require("../modules/create");
let dashboardHelper = require("../modules/createDashboard");
let _class = require("../modules/classNames");
let analytics = require("../modules/analytics");
let query = require("../modules/query");

Parse.Cloud.define("landingPage", function(req, res){

  const ID = req.params.admin;
  console.log("USER ID " + JSON.stringify(ID));
  let pageInfo = {};
  let _project = [];
  const limit = 5;
  // console.log("PARAMS " + req.params);
 Parse.Promise.when(
      new Parse.Query(_class.Projects).equalTo("userId", ID).find({useMasterKey: true})
      // new Parse.Query(_class.Product).limit(limit).find({useMasterKey: true}),
      // new Parse.Query(_class.Categories).limit(limit).find({useMasterKey: true}),
      // new Parse.Query(_class.Authors).limit(limit).find({useMasterKey: true})
    ).then(function(projects){
      // , products, categories, authors
      let results = dashboardHelper.Projects(projects);
      console.log("RESULTS FROM DASHBOARD HELPER " + JSON.stringify(results));
       _project.push(results);
       pageInfo.project = _project
      // pageInfo.products = products;
      // pageInfo.categories = categories;
      // pageInfo.authors = authors;

      res.success(util.setResponseOk(pageInfo));

    },function (error) {

        util.handleError(res, error);

    })

});

Parse.Cloud.define("getHomeFeed", function (req, res) {
  let homeFeed = {};
  let projectId = req.params.projectId;
  const ADMIN = req.params.admin;
  let projectArray;
  const limit = 5;
  const otherLimit = 2;
  projectArray.push(projectId);

  Parse.Promise.when(
      new Parse.Query(_class.Feed).equalTo("projectId", projectId).equalTo("userId", ADMIN).equalTo("type", type.FEED_TYPE.sticker).first({useMasterKey: true}),
      new Parse.Query(_class.Feed).equalTo("projectId", projectId).equalTo("userId", ADMIN).equalTo("type", type.FEED_TYPE.story).first({useMasterKey: true}),
      new Parse.Query(_class.Packs).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).descending("createdAt").limit(limit).find({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).descending("createdAt").limit(limit).find({useMasterKey: true}),
      new Parse.Query(_class.Packs).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).find({useMasterKey: true}),
      new Parse.Query(_class.Categories).count({useMasterKey: true}),
      new Parse.Query(_class.Packs).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).count({useMasterKey: true}),
      new Parse.Query(_class.Stickers).equalTo("userId", ADMIN).count({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).count({useMasterKey: true}),
      new Parse.Query(_class.Adverts).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).limit(limit).find({useMasterKey: true}),
      new Parse.Query(_class.Projects).limit(limit).find({useMasterKey: true}),
      new Parse.Query(_class.Projects).equalTo("userId", ADMIN).count({useMasterKey: true}),
      new Parse.Query(_class.Projects).equalTo("objectId", projectId).first({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).equalTo("storyType", type.STORY_TYPE.jokes)
          .limit(otherLimit).find({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).equalTo("storyType", type.STORY_TYPE.quotes)
          .limit(otherLimit).find({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).equalTo("storyType", type.STORY_TYPE.history)
          .limit(otherLimit).find({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).equalTo("storyType", type.STORY_TYPE.news)
          .limit(otherLimit).find({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).equalTo("storyType", type.STORY_TYPE.facts)
          .limit(otherLimit).find({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).equalTo("storyType", type.STORY_TYPE.episodes)
          .limit(otherLimit).find({useMasterKey: true})
        ).then(function(sticker, latestStory, collection, story, allPacks, categoryLength, packLength,stickerLength, storyLength, allAdverts, projects, projectLength, projectItem,
          jokes, quotes, history, news, facts, episodes){
            homeFeed.collection = collection;
            homeFeed.story = story;
            homeFeed.allPacks = allPacks;
            homeFeed.allAds = allAdverts;
            homeFeed.allProjects = projects;
            homeFeed.projectItem = projectItem;
            homeFeed.jokes = jokes;
            homeFeed.quotes = quotes;
            homeFeed.news = news;
            homeFeed.history = history;
            homeFeed.facts = facts;
            homeFeed.episodes = episodes;
            homeFeed.categoryLength = helper.leadingZero(categoryLength);
            homeFeed.packLength = helper.leadingZero(packLength);
            homeFeed.stickerLength = helper.leadingZero(stickerLength);
            homeFeed.storyLength = helper.leadingZero(storyLength);
            homeFeed.projectLength = helper.leadingZero(projectLength);

            if (latestStory && sticker) {
                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first(),
                    new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first(),
                    new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first()
                );
            } else if (latestStory && sticker === undefined) {
                return Parse.Promise.when(
                    undefined,
                    new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first(),
                    new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first()
                );
            } else if (sticker && latestStory === undefined) {
                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first(),
                    undefined,
                    undefined
                );
            } else {
                return Parse.Promise.when(
                    undefined,
                    undefined,
                    undefined
                );
            }
        }).then(function(latestSticker, storyImage, storyBody){
          if (latestSticker !== undefined) {
              _latestSticker = latestSticker.get("uri");
              homeFeed.latestStickerName = latestSticker.get("name");
              homeFeed.latestStickerDescription = latestSticker.get("description");
          }

          if (storyBody !== undefined) {

              homeFeed.storyBody = storyBody;

          } else {

              homeFeed.storyBody = "";

          }

          if (storyImage !== undefined) {
              stickerId = storyImage.get("stickerId");

              return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

          } else {
              stickerId = "";

              return stickerId;

          }
        }).then(function(sticker){
           homeFeed.sticker = sticker;

           res.success(util.setResponseOk(homeFeed));

        }, function(error){

          util.handleError(res, error);

        })
});

Parse.Cloud.define("getHomeStickers", function (req, res) {

    new Parse.Query(_class.Packs).equalTo("objectId", process.env.DEFAULT_PACK).first().then(function (pack) {

        if (pack) {

            let col = pack.relation(_class.Packs);
            return col.query().limit(40).find();

        } else {
            return []
        }

    }).then(function (stickers) {

        if (stickers.length) {

            stickers = helper.shuffle(stickers);
            stickers = stickers.slice(0, 3);
            let _sticker = [];
            stickers.forEach(sticker => {
                _sticker.push(create.Sticker(sticker))
            });

            res.success(util.setResponseOk(_sticker));


        }

    },function (error) {

        util.handleError(res, error);
    })


});
