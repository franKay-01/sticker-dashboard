let util = require("../modules/util");
let helper = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');
let create = require("../modules/create");
let dashboardHelper = require("../modules/createDashboard");
let _class = require("../modules/classNames");
let analytics = require("../modules/analytics");
let query = require("../modules/query");
const PARSE_LIMIT = 1000;

Parse.Cloud.define("getPackFeed", function(req, res){
  const ID = req.params.admin;
  let packId = req.params.packId;
  let projectId = req.params.projectId;
  let projectArray = [];
  projectArray.push(projectId);
  let packfeed = {};
  let _stickers = [];
  let stickerItem;
  let packInfo;
  let limit = 5;

  return new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true})
  .then(function(pack){
    packInfo = pack;
    let _pack = dashboardHelper.PackItem(pack);

    packfeed.pack = _pack;

    let packRelation = pack.relation(_class.Packs);

    return packRelation.query().limit(PARSE_LIMIT).ascending("name").find({useMasterKey: true});

  }).then(function(stickers){
console.log("STICKERS 1 " + JSON.stringify(_stickers));
    stickers.forEach(sticker => {

      stickerItem = dashboardHelper.Sticker(stickers)
      _stickers.push(stickerItem);

    });
    console.log("STICKERS " + JSON.stringify(_stickers));
    packfeed.stickers = _stickers;

    return Parse.Promise.when(
        new Parse.Query(_class.Packs).equalTo("userId", ID).containedIn("projectIds", packInfo.get("projectIds")).find(),
        new Parse.Query(_class.Product).find(),
        new Parse.Query(_class.Projects).containedIn("objectId", packInfo.get("projectIds")).limit(limit).find()
    );

  }).then(function(packs, products, projects){
    // let _packs = dashboardHelper.Packs(packs);
    // let _products = dashboardHelper.Products(products);
    let _currentProjects = dashboardHelper.CommonItems(projects);
    packfeed.projects = _currentProjects;
    res.success(util.setResponseOk(packfeed));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("createNewAdvert", function(req, res){
  const ID = req.params.admin;
  let advertTitle = req.params.title;
  let advertDescription = req.params.description;
  let actionButton = req.params.action;
  let projectId = req.params.projectId;
  let projectArray = [];

  projectArray.push(projectId);

  let Advert = new Parse.Object.extend(_class.Adverts);
  let advert = new Advert();

  advert.set("title", advertTitle);
  advert.set("description", advertDescription);
  advert.set("userId", ID);
  advert.set("buttonAction", actionButton);
  advert.set("projectIds", projectArray);

  advert.save().then(function(advert){

    res.success(util.setResponseOk(advert));

  }, function(error){

    util.handleError(res, error);

  });

});

Parse.Cloud.define("createNewStory", function(req, res){
  const ID = req.params.admin;
  let storyTitle = req.params.title;
  let storySummary = req.params.summary;
  let storyType = parseInt(req.params.type);
  let storyFormat = req.params.format;
  let projectId = req.params.projectId;
  let projectArray = [];

  projectArray.push(projectId);

  let Stories = new Parse.Object.extend(_class.Stories);
  let story = new Stories();

  story.set("title", storyTitle);
  story.set("summary", storySummary);
  story.set("packId", "");
  story.set("keywords", []);
  // story.set("is_latest_story", false);
  story.set("published", false);
  story.set("projectIds", projectArray);
  story.set("userId", ID);
  story.set("status", 0);
  story.set("storyType", storyType);
  story.set("format", storyFormat);
  story.set("authorId", "");
  story.set("info", {"topColor": "","bottomColor": "","incoming": "","outgoing": ""});

  story.save().then(function(story){

    res.success(util.setResponseOk(story));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("createNewMember", function(req, res){
  const ID = req.params.admin;
  let memberName = req.params.name;
  // let files = req.files;
  let memberDescription = req.params.description;
  let memberSex = req.params.sex;

  let Member = new Parse.Object.extend(_class.Members);
  let member = new Member();

  member.set("profile", {
      "content": {
          "name": memberName,
          "description": memberDescription,
          "sex": memberSex
      }
  });
  member.set("chatIds", []);
  member.set("userId", ID);

  member.save().then(function(member){
    console.log("MEMBER " + JSON.stringify(member));
    res.success(util.setResponseOk(member));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("createNewPack", function(req, res){
  const ID = req.params.admin;
  let packDescription = req.params.description;
  let packName = req.params.name;
  let projectId = req.params.projectId;
  let packCategory = req.params.category;
  let packType = parseInt(req.params.type);
  let version = parseInt(req.params.version);
  let projectArray = [];
  projectArray.push(projectId);

  let PackCollection = new Parse.Object.extend(_class.Packs);
  let pack = new PackCollection();
  pack.set("name", packName);
  pack.set("description", packDescription);
  pack.set("userId", ID);
  pack.set("status", type.PACK_STATUS.pending);
  pack.set("version", version);
  pack.set("projectIds", projectArray);
  pack.set("productId", "");
  pack.set("archived", false);
  pack.set("flagged", false);
  pack.set("published", false);
  pack.set("previews", []);

  if (packCategory === "") {

      pack.set("keywords", [""]);

  } else {

      pack.set("keywords", [packCategory]);

  }
  if (packType === type.PACK_TYPE.grouped) {

      pack.set("packType", type.PACK_TYPE.grouped);

  } else if (packType === type.PACK_TYPE.themed) {

      pack.set("packType", type.PACK_TYPE.themed);

  } else if (packType === type.PACK_TYPE.curated) {

      pack.set("packType", type.PACK_TYPE.curated);

  }

  pack.save().then(function(pack){

    res.success(util.setResponseOk(pack));

  }, function(error){

    util.handleError(res, error);

  })
})

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

  categories.forEach(category => {

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
  let page = {};

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


      page.project = projectItems;
      page.products = productItems;
      page.categories = categoryItems;
      page.authors = authorItems;

      res.success(util.setResponseOk(page));

    },function (error) {

        util.handleError(res, error);

    })

});

Parse.Cloud.define("getHomeFeed", function (req, res) {
  let homeFeed = {};
  let projectArray = [];
  let projectId = req.params.projectId;
  const ADMIN = req.params.admin;
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

            homeFeed.packInfo = _collections;
            homeFeed.storiesInfo = _stories;
            homeFeed.advertInfo = _allAdverts;
            homeFeed.projectInfo = _projects;
            homeFeed.projectItem = _projectItem;
            homeFeed.jokeInfo = _jokes;
            homeFeed.quoteInfo = _quotes;
            homeFeed.newsInfo = _news;
            homeFeed.historyInfo = _history;
            homeFeed.factInfo = _facts;
            homeFeed.episodeInfo = _episodes;

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
              console.log("ENTERED FIRST LAP");
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
          console.log("ENTERED SECOND LAP");

          if (latestSticker !== undefined) {
              homeFeed.latestSticker = latestSticker.get("uri").url();
              homeFeed.latestStickerName = latestSticker.get("name");
              homeFeed.latestStickerDescription = latestSticker.get("description");
          }else {
            homeFeed.latestSticker = "";
            homeFeed.latestStickerName = "";
            homeFeed.latestStickerDescription = "";
          }

          if (storyBody !== undefined) {

              homeFeed.latestStoryTitle = storyBody.get("title");
              homeFeed.latestStorySummary = storyBody.get("summary");

          } else {

            homeFeed.latestStoryTitle = "";
            homeFeed.latestStorySummary = "";

          }

          if (storyImage !== undefined) {
              stickerId = storyImage.get("stickerId");

              return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

          } else {
              stickerId = "";

              return stickerId;

          }
        }).then(function(sticker){
          if (sticker !== ""){
            homeFeed.latestStorySticker = sticker.get("uri").url();
          }else {
            homeFeed.latestStorySticker = sticker;
          }

           console.log("FINISHED LAST " + JSON.stringify(homeFeed));
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
