let util = require("../modules/util");
let helper = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');
let create = require("../modules/create");
let dashboardHelper = require("../modules/createDashboard");
let _class = require("../modules/classNames");
let analytics = require("../modules/analytics");
let query = require("../modules/query");


Parse.Cloud.define("createNewProduct", function(req, res){
  const ID = req.params.admin;
  const productName = req.params.name;
  const productDescription = req.params.description;
  let productObject = {"android": "", "ios": ""};

  let Product = new Parse.Object.extend(_class.Product);
  let product = new Product();

  product.set("name", productName);
  product.set("description", productDescription);
  product.set("userId", ID);
  product.set("published", false);
  product.set("productId", productObject);
  product.set("price", productObject);

  product.save().then(function(product){

    res.success(util.setResponseOk(product));

  }, function(error){

    util.handleError(res, error);

  });
})

Parse.Cloud.define("createNewAuthors", function(req, res){
  const ID = req.params.admin;
  const authorName = req.params.name;
  const authorEmail = req.params.email;
  const authorNumber = req.params.number;
  const authorSocial = req.params.social;

  let Author = new Parse.Object.extend(_class.Authors);
  let author = new Author();

  author.set("name", authorName);
  author.set("email", authorEmail);
  author.set("phone", authorNumber);
  author.set("socialHandles", authorSocial);

  author.save().then(function(author){

    res.success(util.setResponseOk(author));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("createNewCategories", function(req, res){

  const ID = req.params.admin;
  const categories = req.params.categories;
  const categoryDetails = [];

  categories.forEach(function (category) {

      let Category = new Parse.Object.extend(_class.Categories);
      let new_category = new Category();

      new_category.set("name", category.toLowerCase());
      categoryDetails.push(new_category);

  });

 Parse.Object.saveAll(categoryDetails).then(function(categories){
   res.success(util.setResponseOk(categories));

 }, function(error){

   util.handleError(res, error);

 });
});

Parse.Cloud.define("createNewProject", function(req, res){

  const ID = req.params.admin;
  const projectName = req.params.projectName;
  const _project = [];

  let Project = new Parse.Object.extend(_class.Projects);
  let project = new Project();

  project.set("name", projectName);
  project.set("userId", ID);
  project.set("version", 1);
  project.set("setting", {
      "title": "#a46580",
      "text": "#a46580",
      "button": "#a46580",
      "cardTopColor": "#df5A34",
      "cardBottomColor": "#814ea4"
  });

  project.save().then(function(project){
    _project.push(project.id);
    res.success(util.setResponseOk(_project));

  }, function(error){
    util.handleError(res, error);
  })

});


Parse.Cloud.define("landingPage", function(req, res){

  const ID = req.params.admin;
  let pageInfo = {};

  const limit = 5;
  // console.log("PARAMS " + req.params);
 Parse.Promise.when(
      new Parse.Query(_class.Projects).equalTo("userId", ID).find({useMasterKey: true}),
      new Parse.Query(_class.Product).limit(limit).find({useMasterKey: true}),
      new Parse.Query(_class.Categories).limit(limit).find({useMasterKey: true}),
      new Parse.Query(_class.Authors).limit(limit).find({useMasterKey: true})
    ).then(function(projects, products,categories, authors){
      let projectItems = dashboardHelper.Projects(projects);
      let productItems = dashboardHelper.CommonItems(products);
      let authorItems = dashboardHelper.CommonItems(authors);
      let categoryItems = dashboardHelper.CommonItems(categories);

      pageInfo.project = projectItems;
      pageInfo.products = productItems;
      pageInfo.categories = categoryItems;
      pageInfo.authors = authorItems;

      res.success(util.setResponseOk(pageInfo));

    },function (error) {

        util.handleError(res, error);

    })

});

Parse.Cloud.define("getHomeFeed", function (req, res) {
  let homeFeed = {};
  let projectId = req.params.projectId;
  console.log("PROJECT ID " + projectId);
  const ADMIN = req.params.admin;
  let projectArray = [];
  const limit = 5;
  const otherLimit = 2;
  projectArray.push(projectId);

  Parse.Promise.when(
      new Parse.Query(_class.Feed).equalTo("projectId", projectId).equalTo("userId", ADMIN).equalTo("type", type.FEED_TYPE.sticker).first({useMasterKey: true}),
      new Parse.Query(_class.Feed).equalTo("projectId", projectId).equalTo("userId", ADMIN).equalTo("type", type.FEED_TYPE.story).first({useMasterKey: true}),
      new Parse.Query(_class.Packs).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).descending("createdAt").limit(limit).find({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ADMIN).containedIn("projectIds", projectArray).descending("createdAt").limit(limit).find({useMasterKey: true}),
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
        ).then(function(sticker, latestStory, collection, story, categoryLength,
          packLength,stickerLength,storyLength, allAdverts, projects, projectLength,
          projectItem,jokes, quotes, history, news, facts, episodes){


            let _collections = dashboardHelper.CommonItems(collection);
            let _stories = dashboardHelper.StoryTitles(story);
            let _allAdverts = dashboardHelper.StoryTitles(allAdverts);
            let _projects = dashboardHelper.CommonItems(projects);
            let _projectItem = dashboardHelper.ProjectItem(projectItem);
            let _jokes = dashboardHelper.StoryTitles(jokes);
            let _quotes = dashboardHelper.StoryTitles(quotes);
            let _news = dashboardHelper.StoryTitles(news);
            let _history = dashboardHelper.StoryTitles(history);
            let _facts = dashboardHelper.StoryTitles(facts);
            let _episodes = dashboardHelper.StoryTitles(episodes);

            homeFeed.collection = _collections;
            homeFeed.story = _stories;
            homeFeed.adverts = _allAdverts;
            homeFeed.projects = _projects;
            homeFeed.projectItem = _projectItem;
            homeFeed.jokes = _jokes;
            homeFeed.quotes = _quotes;
            homeFeed.news = _news;
            homeFeed.history = _history;
            homeFeed.facts = _facts;
            homeFeed.episodes = _episodes;

            homeFeed.categoryLength = helper.leadingZero(categoryLength);
            homeFeed.packLength = helper.leadingZero(packLength);
            homeFeed.stickerLength = helper.leadingZero(stickerLength);
            homeFeed.storyLength = helper.leadingZero(storyLength);
            homeFeed.projectLength = helper.leadingZero(projectLength);

            console.log("FEED ITEMS " + JSON.stringify(homeFeed));

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
              homeFeed.latestSticker = latestSticker.get("uri");
              homeFeed.latestStickerName = latestSticker.get("name");
              homeFeed.latestStickerDescription = latestSticker.get("description");
          }

          if (storyBody !== undefined) {

              homeFeed.latestStoryBody = storyBody;

          } else {

              homeFeed.latestStoryBody = "";

          }

          if (storyImage !== undefined) {
              stickerId = storyImage.get("stickerId");

              return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

          } else {
              stickerId = "";

              return stickerId;

          }
        }).then(function(sticker){
           homeFeed.latestStorySticker = sticker;

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
