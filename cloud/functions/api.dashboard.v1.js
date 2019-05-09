let util = require("../modules/util");
let helper = require("../modules/helpers");
let type = require("../modules/type");
let _ = require('underscore');
let create = require("../modules/create");
let dashboardHelper = require("../modules/createDashboard");
let _class = require("../modules/classNames");
let analytics = require("../modules/analytics");
let query = require("../modules/query");
let notification = require('../modules/notifications');

const image2base64 = require('image-to-base64');
const PARSE_LIMIT = 1000;
let count = 0;

const STICKER = "sticker";
const STORIES = "story";

Parse.Cloud.define("submitForReview", function(req, res){
  let itemId = req.params.itemId;
  let currentType = req.params.itemType;
  let Query;

  if (currentType === "Pack"){
    Query = new Parse.Query(_class.Packs);
  }else if (currentType === "Story") {
    Query = new Parse.Query(_class.Stories);
  };

  return Query.equalTo("objectId", itemId).first({useMasterKey: true})
  .then(function(item){

    item.set("status", type.PACK_STATUS.review);
    return item.save();

  }).then(function() {

    res.success(util.setResponseOk(true));

    }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("addReports", function(req, res){
  let selected = req.params.selected;
  let itemId = req.params.itemId;
  let reportTitle = req.params.reportTitle;
  let currentType = req.params.currentType;
  let errorContent = [];
  let condition = type.PACK_STATUS.rejected;
  let selectArray = [];
  let Query;
  selectArray = selected.split(",");

  if (currentType === "Pack"){
    Query = new Parse.Query(_class.Packs);
  }else if (currentType === "Story") {
    Query = new Parse.Query(_class.Stories);
  };

  if (selectArray.length > 1){
    _.each(selectArray, function (select) {
        if (parseInt(select) === type.REJECTIONS.artwork.id) {

            errorContent.push(type.REJECTIONS.artwork);

        }else if (parseInt(select) === type.REJECTIONS.sticker.id) {

            errorContent.push(type.REJECTIONS.sticker);

        }else if (parseInt(select) === type.REJECTIONS.names.id) {

            errorContent.push(type.REJECTIONS.names);

        }
    });
  }else {
    if (parseInt(selected) === type.REJECTIONS.artwork.id) {

        errorContent.push(type.REJECTIONS.artwork);

    }else if (parseInt(selected) === type.REJECTIONS.sticker.id) {

        errorContent.push(type.REJECTIONS.sticker);

    }else if (parseInt(selected) === type.REJECTIONS.names.id) {

        errorContent.push(type.REJECTIONS.names);

    }
  }

  let Report = new Parse.Object.extend(_class.Reports);
  let report = new Report();

  report.set("itemId", itemId);
  report.set("title", reportTitle);
  report.set("contents", errorContent);
  report.set("read", false);

  return report.save().then(function(){

    return Query.equalTo("objectId", itemId).first({useMasterKey: true});

  }).then(function(item){

    item.set("status", condition);
    return item.save();

  }).then(function(){

    res.success(util.setResponseOk(true));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("approveItem", function(req, res){

  let itemId = req.params.itemId;
  let currentType = req.params.currentType;
  let Query;
  let condition = type.PACK_STATUS.approved;

  if (currentType === "Pack"){
    Query = new Parse.Query(_class.Packs);
  }else if (currentType === "Story") {
    Query = new Parse.Query(_class.Stories);
  };

  return Query.equalTo("objectId", itemId).first({useMasterKey: true}).then(function(item){

    item.set("status", condition);
    return item.save();

  }).then(function(){

    res.success(util.setResponseOk(true));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("updateDescription", function(req, res){
  let stickerId = req.params.stickerId;
  let description = req.params.description;

  return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first()
  .then(function(sticker){

    sticker.set("description", description);

    return sticker.save();

  }).then(function(){

    res.success(util.setResponseOk(true));

  }, function(error){

    util.handleError(res, error);

  })
})

Parse.Cloud.define("setStickerFeed", function(req, res){
  let itemId = req.params.itemIds;
  let projectId = req.params.projectId;
  let ID = req.params.admin;

  return new Parse.Query(_class.Feed).equalTo("projectId", projectId)
  .equalTo("userId", ID).equalTo("type", type.FEED_TYPE.sticker).first({useMasterKey:true})
  .then(function(latest){
    if (latest) {

        latest.set("feedId", itemId);
        return latest.save();

    } else {

        let Latest = new Parse.Object.extend(_class.Feed);
        let latest = new Latest();

        latest.set("feedId", itemId);
        latest.set("userId", ID);
        latest.set("projectId", projectId);
        latest.set("type", type.FEED_TYPE.sticker);

        return latest.save();
    }
  }).then(function(){
    let Selected = new Parse.Object.extend(_class.History);
    let selected = new Selected();

      selected.set("type", type.FEED_TYPE.sticker);
      selected.set("itemId", itemId);
      selected.set("projectId", projectId);

    return selected.save();
  }).then(function(){

    return new Parse.Query(_class.Stickers).equalTo("objectId", itemId).first({useMasterKey: true});

  }).then(function(sticker){

      res.success(util.setResponseOk(true));
    // let _sticker = create.Sticker(sticker);
    //   notification.send({
    //       title: "Sticker Of the Day",
    //       description: _sticker.description,
    //       activity: "STICKER_ACTIVITY",
    //       data: {
    //           id: _sticker.id,
    //           name: _sticker.name,
    //           url: _sticker.url,
    //           type: notificationType
    //       },
    //       //TODO retrieve first section from Server
    //       topic: process.env.TOPIC_PREFIX + "feed.sticker"
    //   }).then(function (success) {
    //
    //       console.log("STICKER NOTIFICATION WAS SENT SUCCESSFULLY");
    //       res.success(util.setResponseOk(true));
    //
    //   }, function (status) {
    //
    //       console.log("STICKER NOTIFICATION WASN'T SENT " + status);
    //
    //   });
  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("setStoryFeed", function(req, res){
  let source = req.params.source;
  let itemId = req.params.itemIds;
  let projectId = req.params.projectId;
  let ID = req.params.admin;
  let Query;
  let _story = {};

  return new Parse.Query(_class.Feed).equalTo("type", type.FEED_TYPE.story)
  .equalTo("projectId", projectId).equalTo("userId", ID).first({useMasterKey:true})
  .then(function(latest){

   if (latest) {

       latest.set("feedId", itemId);
       return latest.save();

   } else {

       let Latest = new Parse.Object.extend(_class.Feed);
       let latest = new Latest();

       latest.set("feedId", itemId);
       latest.set("userId", ID);
       latest.set("projectId", projectId);
       latest.set("type", type.FEED_TYPE.story);

       return latest.save();
   }
 }).then(function(){

   let Selected = new Parse.Object.extend(_class.History);
   let selected = new Selected();

     selected.set("type", type.FEED_TYPE.story);
     selected.set("itemId", itemId);
     selected.set("projectId", projectId);

   return selected.save();

 }).then(function(){
   console.log("TRYING SEND NOTIFICATION 1");

    return Parse.Promise.when(
         new Parse.Query(_class.Stories).equalTo("objectId", itemId).first({useMasterKey: true}),
         new Parse.Query(_class.ArtWork).equalTo("itemId", itemId).first({useMasterKey: true})
     );

 }).then(function(item, artwork){

     _story = item;
     return new Parse.Query(_class.Stickers).equalTo("objectId", artwork.get("stickerId")).first({useMasterKey: true});

 }).then(function(sticker){

   //         let story = create.Story(_story);
   //         story = create.StoryArtwork(story, sticker);
   //
   //         notification.send({
   //             title: story.title,
   //             description: story.summary,
   //             activity: "STORY_ACTIVITY",
   //             data: {
   //                 id: story.id,
   //                 title: story.title,
   //                 stickerUrl: story.stickerUrl,
   //                 summary: story.summary,
   //                 topColor: story.topColor,
   //                 bottomColor: story.bottomColor,
   //                 type: notificationType
   //             },
   //
   //             //TODO retrieve first section from Server
   //             topic: process.env.TOPIC_PREFIX + "feed.story"
   //
   //         }).then(function (success) {
   //
   //             console.log("STORY NOTIFICATION WAS SENT SUCCESSFULLY");
   //             res.success(util.setResponseOk(true));
   //
   //         }, function (status) {
   //
   //             console.log("STORY NOTIFICATION WASN'T SENT " + status);
   //
   //         });
   //
   res.success(util.setResponseOk(true));
 }, function(error){

   util.handleError(res, error);

 })

});

Parse.Cloud.define("getStickerOfTheWeek", function(req, res){

  let ID = req.params.admin;
  let stickerDetails = {};
  console.log("HERE @ " + ID);
  return new Parse.Query(_class.Stickers).equalTo("sold", false).equalTo("userId", ID).find({useMasterKey: true})
  .then(function(stickers){
    console.log("HERE @ " + JSON.stringify(stickers));
    stickerDetails.stickers = dashboardHelper.FeedStickers(stickers);

    res.success(util.setResponseOk(stickerDetails));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("getStoryOfTheDay", function(req, res){

  let ID = req.params.admin;
  let projectId = req.params.projectId;
  let projectArray = [];
  let _allArtwork = [];
  let storyDetails = {};
  let combined = [];
  let _stories = [];
  let artWork = [];

  projectArray.push(projectId);

  return Parse.Promise.when(
      new Parse.Query(_class.Stories).equalTo("userId", ID).containedIn("projectIds", projectArray).find({useMasterKey: true}),
      new Parse.Query(_class.ArtWork).find({useMasterKey: true})
  ).then(function(stories,artworks){
      _allArtwork = artworks;

      if (stories) {

          _.each(stories, function (story) {
              if (story.get("published") === true) {

                  _stories.push(story);

              }
          });

          _.each(artworks, function (artwork) {

              artWork.push(artwork.get("stickerId"));

          });

          storyDetails.stories = dashboardHelper.Stories(_stories);

          return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find({useMasterKey: true});

    }else {

        storyDetails.stories = "";
        storyDetails.stickers = "";
        res.success(util.setResponseOk(storyDetails));

    }

  }).then(function(stickers){

    _.each(_allArtwork, function (artworks) {

        _.each(stickers, function (sticker) {

            if (artworks.get("stickerId") === sticker.id) {

                combined.push({
                    story: artworks.get("itemId"),
                    image: sticker.get("uri").url()
                });
            }
        })
    });

    storyDetails.stickers = combined;
    res.success(util.setResponseOk(storyDetails));

  }, function(error){

    util.handleError(res, error);

  });
});


Parse.Cloud.define("getAdvertDetails", function(req, res){

  let advertId = req.params.advertId;
  let projectId = req.params.projectId;
  let advertDetails = {};

  return Parse.Promise.when(
      new Parse.Query(_class.Adverts).equalTo("objectId", advertId).first({useMasterKey:true}),
      new Parse.Query(_class.AdvertImages).equalTo("advertId", advertId).find({useMasterKey:true}),
      new Parse.Query(_class.Links).equalTo("itemId", advertId).first({useMasterKey:true}),
      new Parse.Query(_class.Projects).equalTo("objectId", projectId).first({useMasterKey:true})
  ).then(function(advert, advertImages, link, projects){
    console.log("LINK ####### " + JSON.stringify(link));
    advertDetails.ads = dashboardHelper.SingleAdvert(advert);
    advertDetails.images = dashboardHelper.AdvertImages(advertImages);
    if (link !== undefined){
      advertDetails.link = true;
    }else {
      advertDetails.link = false;
    }

    res.success(util.setResponseOk(advertDetails));

  }, function(error){

    util.handleError(res, error);

  })
})

Parse.Cloud.define("allAdverts", function(req, res){
  let ID = req.params.admin;
  let projectId = req.params.projectId;
  let _adverts = [];
  let projectArray = [];
  let advertDetails = {};
  projectArray.push(projectId);

  return Parse.Promise.when(
      new Parse.Query(_class.Adverts).equalTo("userId", ID).containedIn("projectIds", projectArray).find({useMasterKey: true}),
      new Parse.Query(_class.AdvertImages).find({useMasterKey: true}),
      new Parse.Query(_class.Projects).equalTo("objectId", projectId).first({useMasterKey: true})
  ).then(function(adverts, ad_images, project){
    _.each(adverts, function (advert) {

        _.each(ad_images, function (image) {

            if (advert.id === image.get("advertId")) {

                //TODO modify query to group types
                //TODO use type constants from types JS e.g type.LINKS.android
                // if (image.get("type") === 0) {
                    _adverts.push({
                        id: advert.id,
                        name: advert.get("title"),
                        image: image.get("uri").url()
                    })
                // }
            }

        });
    });

    let spliced = [];

    for (let i = 0; i < adverts.length; i = i + 1) {
        for (let j = 0; j < _adverts.length; j = j + 1) {

            if (adverts[i].get("title") === _adverts[j].name) {
                adverts.splice(i, 1);
                spliced.push(i);
            }
        }
    }

    let adResults = dashboardHelper.AdertDetails(adverts);
    console.log("ADVERTS ###### " + JSON.stringify(adResults));

    let final = _adverts.concat(adResults)

    advertDetails.ads = final;

    res.success(util.setResponseOk(advertDetails));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("previewEpisode", function(req, res){

  let episodeId = req.params.storyId;
  let episodeDetails = {};
  let topColor;
  let storyType = "";

  return new Parse.Query(_class.Episodes).equalTo("objectId", episodeId).first({useMasterKey: true})
  .then(function(episode){

  episodeDetails.episode = dashboardHelper.SingleEpisode(episode);

    return Parse.Promise.when(
        new Parse.Query(_class.StoryItems).equalTo("storyId", episode.id).find({useMasterKey: true}),
        new Parse.Query(_class.Stories).equalTo("objectId", episode.get("storyId")).first({useMasterKey: true}),
        new Parse.Query(_class.ArtWork).equalTo("itemId", episode.get("storyId")).first({useMasterKey: true})
    )
  }).then(function(storyItems, story, sticker){
// storyItemDetails.storyItems
     episodeDetails.storyItems = dashboardHelper.StoryItems(storyItems);

    if (story.get("storyType") === type.STORY_TYPE.story) {

        storyType = "Story";

    } else if (story.get("storyType") === type.STORY_TYPE.episodes) {

        storyType = "Episode";

    } else if (story.get("storyType") === type.STORY_TYPE.chat_single) {

        storyType = "Chats";

    } else if (story.get("storyType") === type.STORY_TYPE.chat_group_episode) {

      storyType = "Chats";

    }else if (story.get("storyType") === type.STORY_TYPE.chat_single_episode) {

      storyType = "Chats";

    }else if (story.get("storyType") === type.STORY_TYPE.chat_group) {

      storyType = "Chats";

    } else if (story.get("storyType") === type.STORY_TYPE.facts) {

        storyType = "Facts";

    } else if (story.get("storyType") === type.STORY_TYPE.history) {

        storyType = "History";

    } else if (story.get("storyType") === type.STORY_TYPE.jokes) {

        storyType = "Jokes";

    } else if (story.get("storyType") === type.STORY_TYPE.news) {

        storyType = "News";

    } else if (story.get("storyType") === type.STORY_TYPE.quotes) {

        storyType = "Quotes";

    } else if (story.get("storyType") === type.STORY_TYPE.short_stories) {

        storyType = "Short Stories";
    }

    episodeDetails.storyType = storyType;
    episodeDetails.story = story.get("title");

    topColor = story.get("info").topColor;

    if (topColor === "") {
        //use system default
        episodeDetails.topColor = type.DEFAULT.colors.topColor;
        episodeDetails.bottomColor = type.DEFAULT.colors.bottomColor;
    }else {
      episodeDetails.topColor = story.get("info").topColor;
      episodeDetails.bottomColor = story.get("info").bottomColor;
    }

console.log("STICKER ##### " + JSON.stringify(sticker));
    if (sticker){
      return new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first({useMasterKey: true});
    }else {
      return undefined;
    }
  }).then(function(sticker){

  if (sticker){
      episodeDetails.sticker = sticker.get("uri").url();
    }else {
      episodeDetails.sticker = "";
    }

    res.success(util.setResponseOk(episodeDetails));

  }, function(error){

      util.handleError(res, error);

  })
});

Parse.Cloud.define("previewStory", function(req, res){
  let storyId = req.params.storyId;
  let _story;
  let topColor;
  let bottomColor;
  let storyType = "";
  let storyItemDetails = {};

  Parse.Promise.when(
      new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey: true}),
      new Parse.Query(_class.ArtWork).equalTo("itemId", storyId).first({useMasterKey: true})
  ).then(function(story, sticker){
    if (story.get("storyType") === type.STORY_TYPE.story) {

        storyType = "Story";

    } else if (story.get("storyType") === type.STORY_TYPE.episodes) {

        storyType = "Episode";

    } else if (story.get("storyType") === type.STORY_TYPE.chat_single) {

        storyType = "Chats";

    } else if (story.get("storyType") === type.STORY_TYPE.chat_group_episode) {

      storyType = "Chats";

    }else if (story.get("storyType") === type.STORY_TYPE.chat_single_episode) {

      storyType = "Chats";

    }else if (story.get("storyType") === type.STORY_TYPE.chat_group) {

      storyType = "Chats";

    } else if (story.get("storyType") === type.STORY_TYPE.facts) {

        storyType = "Facts";

    } else if (story.get("storyType") === type.STORY_TYPE.history) {

        storyType = "History";

    } else if (story.get("storyType") === type.STORY_TYPE.jokes) {

        storyType = "Jokes";

    } else if (story.get("storyType") === type.STORY_TYPE.news) {

        storyType = "News";

    } else if (story.get("storyType") === type.STORY_TYPE.quotes) {

        storyType = "Quotes";

    } else if (story.get("storyType") === type.STORY_TYPE.short_stories) {

        storyType = "Short Stories";

    }
    storyItemDetails.storyType = storyType;
    storyItemDetails.story = story.get("title");

    topColor = story.get("info").topColor;

    if (!topColor) {
        //use system default
        storyItemDetails.topColor = type.DEFAULT.colors.topColor;
        storyItemDetails.bottomColor = type.DEFAULT.colors.bottomColor;
    }else {
      storyItemDetails.topColor = story.get("info").topColor;
      storyItemDetails.bottomColor = story.get("info").bottomColor;
    }

    if (sticker){
      return Parse.Promise.when(
          new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first({useMasterKey: true}),
          new Parse.Query(_class.StoryItems).equalTo("storyId", storyId).find({useMasterKey: true})
      )
    }else {
      return Parse.Promise.when(
          undefined,
          new Parse.Query(_class.StoryItems).equalTo("storyId", storyId).find({useMasterKey: true})
      )
    }
  }).then(function(sticker, storyItems){
    storyItemDetails.storyItems = dashboardHelper.StoryItems(storyItems);

    if (sticker){
      storyItemDetails.sticker = sticker.get("uri").url();
    }else {
      storyItemDetails.sticker = "";
    }

    res.success(util.setResponseOk(storyItemDetails));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("editEpisodeDetails", function(req, res){
  let episodeId = req.params.episodeId;
  let title = req.params.title;
  let status = req.params.status;
  let episodeDetails = {};

    return new Parse.Query(_class.Episodes).equalTo("objectId", episodeId).first({useMasterKey: true})
    .then(function(episode){
      episode.set("title", title);

      if (status === "true") {
          episode.set("sold", true);
      } else if (status === "false") {
          episode.set("sold", false);
      }

      return episode.save();

    }).then(function(saved){

      episodeDetails.episode = dashboardHelper.SingleEpisode(saved);
      res.success(util.setResponseOk(episodeDetails));

    }, function(error){

      util.handleError(res, error);

    })
});

Parse.Cloud.define("getEpisodeDetails", function(req, res){
  let episodeId = req.params.storyId;
  let episodeDetails = {};

  return new Parse.Query(_class.Episodes).equalTo("objectId", episodeId).first({useMasterKey: true})
  .then(function(episode){
    console.log("EPISODES " + JSON.stringify(episode));
    episodeDetails.episode = dashboardHelper.SingleEpisode(episode);

    return Parse.Promise.when(
        new Parse.Query(_class.Stories).equalTo("objectId", episode.get("storyId")).first({useMasterKey: true}),
        new Parse.Query(_class.Projects).equalTo("objectId", episode.get("projectId")).first({useMasterKey: true})
    )
  }).then(function(story, project){

    episodeDetails.story = dashboardHelper.StoryDetails(story);
    episodeDetails.project = project.get("name");

    res.success(util.setResponseOk(episodeDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("deleteStoryItem", function(req, res){
  let storyItemId = req.params.itemId;
  let assetId;
  let _storyItem;

  return new Parse.Query(_class.StoryItems).equalTo("objectId", storyItemId).first({useMasterKey: true})
  .then(function(storyItem){

    assetId = storyItem.get("contents");
    _storyItem = storyItem;

    storyItem.destroy({
        success: function (object) {
            console.log("removed" + JSON.stringify(object));
            return true;
        },
        error: function (error) {
            console.log("Could not remove" + error);
            util.handleError(res, error);

        }
    })
  }).then(function(){

    if (_storyItem.get("type") === type.STORY_ITEM.image) {

        return new Parse.Query(_class.Assets).equalTo("objectId", assetId.uri).first();

    } else {

      res.success(util.setResponseOk(true));

    }
  }).then(function(asset){
    asset.destroy({
        success: function (object) {
            console.log("removed" + JSON.stringify(object));
            res.success(util.setResponseOk(true));
        },
        error: function (error) {
            console.log("Could not remove" + error);
            util.handleError(res, error);

        }
    })
  }, function(error){

    util.handleError(res, error);

  })
})

Parse.Cloud.define("changeHtmlItem", function(req, res){
  let storyItemId = req.params.itemId;
  let content = req.params.content;
  // let color = req.params.color;
  let itemIndex = parseInt(req.params.itemIndex);
  let previousForm = parseInt(req.params.storyType);
  let storyItemType = parseInt(req.params.newStoryItemType);

  return new Parse.Query(_class.StoryItems).equalTo("objectId", storyItemId).first({useMasterKey: true})
  .then(function(storyItem){
    let contents = storyItem.get("contents");

    let _html = contents.html[itemIndex];
    let htmlType = Object.keys(_html)[0];

    // if (parseInt(htmlType) !== type.STORY_ITEM.color) {

        let html = {};
        // html[htmlType.toString()] = {"text": htmlContent};
        html[storyItemType] = {"text": content};

        contents.html[itemIndex] = html;

    // }

    storyItem.set("contents", contents);
    return storyItem.save();

  }).then(function(saved){

    res.success(util.setResponseOk(true));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("changeStoryItem", function(req, res){
  let storyItemId = req.params.itemId;
  let previousForm = parseInt(req.params.storyType);
  let storyItemType = parseInt(req.params.newStoryItemType);
  let content = req.params.content;
  let storyContent;

  return new Parse.Query(_class.StoryItems).equalTo("objectId", storyItemId).first({useMasterKey:true})
  .then(function(storyItem){

    console.log("STORY ITEM " + JSON.stringify(storyItem));

    _storyItem = storyItem;
    storyContent = storyItem.get("contents");

    if (storyItemType === type.STORY_ITEM.text || storyItemType === type.STORY_ITEM.quote ||
        storyItemType === type.STORY_ITEM.bold || storyItemType === type.STORY_ITEM.italic ||
        storyItemType === type.STORY_ITEM.italicBold) {

        storyItem.set("type", storyItemType);
        storyItem.set("contents", {"text": content});

        return storyItem.save();

    } else if (storyItemType === type.STORY_ITEM.divider) {

        storyItem.set("type", storyItemType);
        storyItem.set("contents", {"": ""});

        return storyItem.save();
    } else if (storyItemType === type.STORY_ITEM.image) {

        if (files) {
            let Asset = new Parse.Object.extend(_class.Assets);
            let asset = new Asset();

            let fullName = files[0].originalname;
            let stickerName = fullName.substring(0, fullName.length - 4);

            let bitmap = fs.readFileSync(files[0].path, {encoding: 'base64'});

            let parseFile = new Parse.File(stickerName, {base64: bitmap}, files[0].mimetype);

            asset.set("uri", parseFile);

            return asset.save();
        }
    } else if (storyItemType === type.STORY_ITEM.sticker) {
        // res.redirect('/storyitem/change/sticker/' + _storyId + '/' + id + '/' + projectId);
    }
  }).then(function(asset){
    if (storyItemType === type.STORY_ITEM.image) {
        _storyItem.set("type", storyItemType);
        _storyItem.set("contents", {"uri": asset.get("uri").url(), "id": asset.id});

        return _storyItem.save();

    } else {

        return true;

    }
  }).then(function(){
    // if (files.length > 0) {
    //     let tempFile = files[0].path;
    //     fs.unlink(tempFile, function (err) {
    //         if (err) {
    //             //TODO handle error code
    //             console.log("-------Could not del temp" + JSON.stringify(err));
    //         }
    //         else {
    //             console.log("SUUCCCEESSSSS IN DELTEING TEMP");
    //         }
    //     });
    // }

    if (previousForm === type.STORY_ITEM.image) {

        return new Parse.Query(_class.Assets).equalTo("objectId", storyContent).first();

    } else {

      res.success(util.setResponseOk(true));

    }

  }).then(function(image){
    image.destroy({
        success: function (object) {

          res.success(util.setResponseOk(object));

        },
        error: function (error) {

          util.handleError(res, error);

        }
    })
  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("updateHtmlItem", function(req, res){
  let storyItemId = req.params.storyItemId;
  let content = req.params.content;
  let color = req.params.color;
  let itemIndex = parseInt(req.params.itemIndex);

  return new Parse.Query(_class.StoryItems).equalTo("objectId", storyItemId).first({useMasterKey:true})
  .then(function(storyItem){

    let contents = storyItem.get("contents");

    let _html = contents.html[itemIndex];

    let htmlType = Object.keys(_html)[0];

    if (parseInt(htmlType) === type.STORY_ITEM.color) {

      let html = {};
      html[htmlType.toString()] = {"text": content, "color": color};

      contents.html[itemIndex] = html;

    } else {

      let html = {};
      html[htmlType.toString()] = {"text": content};

      contents.html[itemIndex] = html;

    }

    storyItem.set("contents", contents);
    return storyItem.save();
  }).then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getHtmlItems", function(req, res){
  let storyItemId = req.params.storyItemId;
  let storyItemDetails = {};

  return new Parse.Query(_class.StoryItems).equalTo("objectId", storyItemId).first({useMasterKey: true})
  .then(function(storyItem){

    storyItemDetails.storyItems = dashboardHelper.HtmlStoryItem(storyItem);

    res.success(util.setResponseOk(storyItemDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("editStoryItem", function(req, res){
  let storyId = req.params.itemId;
  let storyItemType = parseInt(req.params.storyType);
  let content = req.params.content;
  let title = req.params.title;
  let link = req.params.link;
  let heading = req.params.heading;
  let formatCategory = req.params.formatCategory;
  let oneColor = req.params.oneColor;
  let topColor = req.params.topColor;
  let bottomColor = req.params.bottomColor;
  let description = req.params.description;

  return new Parse.Query(_class.StoryItems).equalTo("objectId", storyId).first({useMasterKey: true})
  .then(function(storyItem){

    if (storyItemType === type.STORY_ITEM.text || storyItemType === type.STORY_ITEM.quote ||
        storyItemType === type.STORY_ITEM.bold || storyItemType === type.STORY_ITEM.italic ||
        storyItemType === type.STORY_ITEM.italicBold || storyItemType === type.STORY_ITEM.sideNote ||
        storyItemType === type.STORY_ITEM.greyArea || storyItemType === type.STORY_ITEM.list) {

        object = {"text": content};

    } else if (storyItemType === type.STORY_ITEM.heading) {

        object = {"heading": heading, "text": content};

    }

    if (storyItemType === type.STORY_ITEM.backgroundColor){

        if (formatCategory === type.FORMAT_TYPE.regular){

          object = {"type": formatCategory, "color": oneColor};

      }else if (formatCategory === type.FORMAT_TYPE.gradient) {
          if (bottomColor === undefined){

            object = {"type": formatCategory.toString(), "topColor": topColor, "bottomColor" : bottomColor};

          }else {

            object = {"type": formatCategory.toString(), "topColor": topColor, "bottomColor" : bottomColor};

          }
        }

      }

     if (storyItemType === type.STORY_ITEM.source) {

          object = {"name": title, "description" : description, "link": link};

      }

     if (storyItemType === type.STORY_ITEM.link) {

        object = {"name": title, "url" : link};

      }

      storyItem.set("contents", object);
      return storyItem.save();

  }).then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("addHtmlItem", function(req, res){
  let storyId = req.params.storyItemId;
  let storyType = parseInt(req.params.elementType);
  let content = req.params.content;
  let color = req.params.color;
  let object = {};

  if (storyType === type.STORY_ITEM.text) {

      object = {"0": {"text": content}};

  } else if (storyType === type.STORY_ITEM.bold) {

      object = {"6": {"text": content}};

  } else if (storyType === type.STORY_ITEM.italic) {

      object = {"5": {"text": content}};

  } else if (storyType === type.STORY_ITEM.italicBold) {

      object = {"8": {"text": content}};

  } else if (storyType === type.STORY_ITEM.color) {

      //TODO String(type.)
      object = {"14": {"text": content, "color": color}};

  }

  return new Parse.Query(_class.StoryItems).equalTo("objectId", storyId).first({useMasterKey: true})
  .then(function(storyItem){

    storyItem.get("contents").html.push(object);
    return storyItem.save();

  }).then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("createHtml", function(req, res){
  let storyId = req.params.storyId;
  let storyItemDetails = {};

  let Story = new Parse.Object.extend(_class.StoryItems);
  let storyItem = new Story();

  storyItem.set("type", type.STORY_ITEM.html);
  storyItem.set("contents", {"html": []});
  storyItem.set("storyId", storyId);

  storyItem.save().then(function(saved) {
    storyItemDetails.storyId = saved.id;

    res.success(util.setResponseOk(storyItemDetails));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("storyItemView", function(req, res){
  let ID = req.params.admin;
  let storyId = req.params.storyId;
  let projectId = req.params.projectId;
  let source = "";
  let storyType = "";
  let sticker_array = [];
  let storyItemDetails = {};

  return new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey: true})
  .then(function(story){

    if (story) {
        source = "story";
        if (story.get("storyType") === type.STORY_TYPE.story) {

            storyType = "Story";

        } else if (story.get("storyType") === type.STORY_TYPE.episodes) {

            storyType = "Episode";

        } else if (story.get("storyType") === type.STORY_TYPE.chat_single) {

            storyType = "Chats";

        } else if (story.get("storyType") === type.STORY_TYPE.chat_group_episode) {

          storyType = "Chats";

        }else if (story.get("storyType") === type.STORY_TYPE.chat_single_episode) {

          storyType = "Chats";

        }else if (story.get("storyType") === type.STORY_TYPE.chat_group) {

          storyType = "Chats";

        } else if (story.get("storyType") === type.STORY_TYPE.facts) {

            storyType = "Facts";

        } else if (story.get("storyType") === type.STORY_TYPE.history) {

            storyType = "History";

        } else if (story.get("storyType") === type.STORY_TYPE.jokes) {

            storyType = "Jokes";

        } else if (story.get("storyType") === type.STORY_TYPE.news) {

            storyType = "News";

        } else if (story.get("storyType") === type.STORY_TYPE.quotes) {

            storyType = "Quotes";

        } else if (story.get("storyType") === type.STORY_TYPE.short_stories) {

            storyType = "Short Stories";

        }
    } else {
        source = "episode";
        storyType = "Episodes";

    }
    storyItemDetails.source = source;
    storyItemDetails.storyType = storyType;

    return Parse.Promise.when(
        new Parse.Query(_class.StoryItems).equalTo("storyId", storyId).find({useMasterKey: true}),
        new Parse.Query(_class.Projects).equalTo("objectId", projectId).first({useMasterKey: true})
    )
  }).then(function(storyItem, project){

    storyItemDetails.storyItems = dashboardHelper.StoryItems(storyItem);
    storyItemDetails.project = project;

    res.success(util.setResponseOk(storyItemDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("addStoryItem", function(req, res){
   let ID = req.params.admin;
   let elementType = parseInt(req.params.elementType);
   let content = req.params.content;
   let heading = req.params.heading;
   let author = req.params.author;
   let description = req.params.description;
   let link = req.params.link;
   let url = req.params.url;
   let character = req.params.selectedMember;
   let storyId = req.params.storyId;
   let colorFormat = req.params.colorFormat;
   let topColor = req.params.topColor;
   let bottomColor = req.params.bottomColor;

   console.log("ELEMENT TYPE ##### " + elementType +" COLOR FORMAT "+colorFormat+" TOPCOLOR "+topColor+"BOTTOM "+bottomColor);

   let Story = new Parse.Object.extend(_class.StoryItems);
   let story = new Story();

   switch (elementType) {
       case type.STORY_ITEM.text:
           story.set("type", type.STORY_ITEM.text);
           if (character !== "" || character === undefined) {
               story.set("contents", {
                   "text": content,
                   "character": character
               });

           } else {
               story.set("contents", {"text": content});
           }
           break;
           case type.STORY_ITEM.quote:
               story.set("type", type.STORY_ITEM.quote);
               if (character !== "" || character === undefined) {
                   story.set("contents", {
                       "text": content,
                       "character": character
                   });

               } else {
                   story.set("contents", {"text": content});
               }
               break;

           case type.STORY_ITEM.divider:
               story.set("type", type.STORY_ITEM.divider);
               story.set("contents", {"": ""});
               break;

           case type.STORY_ITEM.italic:
               story.set("type", type.STORY_ITEM.italic);
               if (character !== "" || character === undefined) {
                   story.set("contents", {
                       "text": content,
                       "character": character
                   });

               } else {
                   story.set("contents", {"text": content});
               }
               break;

           case type.STORY_ITEM.bold:
               story.set("type", type.STORY_ITEM.bold);
               if (character !== "" || character === undefined) {
                   story.set("contents", {
                       "text": content,
                       "character": character
                   });

               } else {
                   story.set("contents", {"text": content});
               }
               break;

           case type.STORY_ITEM.italicBold:
               story.set("type", type.STORY_ITEM.italicBold);
               if (character !== "" || character === undefined) {
                   story.set("contents", {
                       "text": content,
                       "character": character
                   });

               } else {
                   story.set("contents", {"text": content});
               }
               break;

           case type.STORY_ITEM.list:
               story.set("type", type.STORY_ITEM.list);
               if (character !== "" || character === undefined) {
                   story.set("contents", {
                       "text": content,
                       "character": character
                   });

               } else {
                   story.set("contents", {"text": content});
               }
               break;

           case type.STORY_ITEM.sideNote:
               story.set("type", type.STORY_ITEM.sideNote);
               story.set("contents", {"text": content});
               break;

           case type.STORY_ITEM.greyArea:
               story.set("type", type.STORY_ITEM.greyArea);
               story.set("contents", {"text": content});
               break;

           case type.STORY_ITEM.heading:
               story.set("type", type.STORY_ITEM.heading);
               story.set("contents", {"heading": heading, "text": content});
               break;

           case type.STORY_ITEM.source:
               story.set("type", type.STORY_ITEM.source);
               story.set("contents", {"name": author, "description": description, "link": link});
               break;

           case type.STORY_ITEM.link:
               story.set("type", type.STORY_ITEM.link);
               story.set("contents", {"name": author, "url": url});
               break;

           case type.STORY_ITEM.backgroundColor:
               if (colorFormat === type.FORMAT_TYPE.regular) {
                   story.set("type", type.STORY_ITEM.backgroundColor);
                   story.set("contents", {"type": colorFormat.toString(), "color": topColor});
                   break;
               } else if (colorFormat === type.FORMAT_TYPE.gradient) {
                   story.set("type", type.STORY_ITEM.backgroundColor);
                   story.set("contents", {
                       "type": colorFormat.toString(),
                       "topColor": topColor,
                       "bottomColor": bottomColor
                   });
                   break;
               }
  }

  story.set("storyId", storyId);

  return story.save().then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })

});


// Parse.Cloud.define("getHtmlItem", function(req, res){
//   let status = req.params.status;
//   let source = req.params.source;
//   let storyId = req.params.storyId;
//   let Query;
//
//   if (status === "old") {
//
//       Query = new Parse.Query(_class.StoryItems);
//
//   }
//
//   return Query.equalTo("objectId", id).first({useMasterKey: true})
//   .then(function(storyItem){
//
//   })
// });

Parse.Cloud.define("getStoryItem", function(req, res){

  let source = req.params.source;
  let storyId = req.params.storyId;
  let _story = "story";
  let _episode = "episode";
  let Query;
  let storyDetails = {};

    if (source === _story) {
         Query = new Parse.Query(_class.Stories);
    } else if (source === _episode) {
         Query = new Parse.Query(_class.Episodes);
    }

   return Query.equalTo("objectId", storyId).first({useMasterKey:true})
   .then(function(story){
   if (source === _story){
       storyDetails.story = dashboardHelper.StoryDetails(story);

       return new Parse.Query(_class.Members).equalTo("chatIds", storyId).find({useMasterKey:true});

   }else if (source === _episode){
     return Parse.Promise.when(
       new Parse.Query(_class.Members).equalTo("chatIds", story.get("storyId")).find({useMasterKey:true}),
       new Parse.Query(_class.Stories).equalTo("objectId", story.get("storyId")).first({useMasterKey:true})
     )
   }
 }).then(function(members,story){

   storyDetails.members = dashboardHelper.MemberDetails(members);

   if (story !== undefined){
     storyDetails.story = dashboardHelper.StoryDetails(story);
   }

   res.success(util.setResponseOk(storyDetails));

 }, function(error){

   util.handleError(res, error);

 })
});

Parse.Cloud.define("createNewEpisode", function(req, res){
  let ID = req.params.admin;
  let projectId = req.params.projectId;
  let storyId = req.params.storyId;
  let title = req.params.title;
  let order = parseInt(req.params.order);
  let status = req.params.type;
  let productId = req.params.productId;

  let Episodes = new Parse.Object.extend(_class.Episodes);
  let episode = new Episodes();

  episode.set("title", title);
  if (status === "free") {
      episode.set("sold", false);
  } else if (status === "sold") {
      episode.set("sold", true);
  }
  episode.set("storyId", storyId);
  episode.set("order", order);
  episode.set("projectId", projectId);
  if (status === "free") {
      episode.set("productId", "free")
  } else if (status === "sold") {
      episode.set("productId", productId)
  }

  episode.save().then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("getStoryEpisodes", function(req, res){
  let ID = req.params.admin;
  let projectId = req.params.projectId;
  let storyId = req.params.storyId;
  let episodeDetails = {};

  return Parse.Promise.when(
      new Parse.Query(_class.Episodes).equalTo("projectId", projectId).equalTo("storyId", storyId).ascending("order").find({useMasterKey: true}),
      // new Parse.Query(_class.Projects).equalTo("objectId", projectId).first({useMasterKey: true}),
      new Parse.Query(_class.Product).equalTo("userId", ID).find({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey: true})
  ).then(function(episodes,products,story){

    episodeDetails.episodes = dashboardHelper.EpisodeDetails(episodes);
    episodeDetails.story = dashboardHelper.StoryDetails(story);
    episodeDetails.products = dashboardHelper.CommonItems(products);

    res.success(util.setResponseOk(episodeDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("addSelectedMembers", function(req, res){
  let ID = req.params.admin;
  let incoming = req.params.incoming;
  let outgoing = req.params.outgoing;
  let selected = req.params.selected;
  let storyId = req.params.storyId;

  return new Parse.Query(_class.Stories).equalTo("objectId", storyId).equalTo("userId", ID)
  .first({useMasterKey:true})
  .then(function(story){
    if (selected === incoming){
      story.get("info").incoming = incoming;
      story.get("info").outgoing = outgoing;
    }else if (selected === outgoing){
      story.get("info").incoming = outgoing;
      story.get("info").outgoing = incoming;
    }
    return story.save();

  }).then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getSelectedMembers", function(req, res){
  let ID = req.params.admin;
  let incoming = req.params.incoming;
  let outgoing = req.params.outgoing;

  let memberDetails = {};
  let memberArray = [];
  memberArray.push(incoming);
  memberArray.push(outgoing);

  return new Parse.Query(_class.Members).equalTo("userId", ID)
  .containedIn("objectId", memberArray).find({useMasterKey:true})
  .then(function(membersDetails){

    memberDetails.members = dashboardHelper.MemberDetails(membersDetails);

    res.success(util.setResponseOk(memberDetails));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("addMember", function(req, res){
  let memberId = req.params.memberId;
  let memberArray = [];
  let chatMembers = [];

  memberArray.push(memberId);

  return new Parse.Query(_class.Members).containedIn("objectId", memberArray)
  .find({useMasterKey: true})
  .then(function(members){

    _.each(members, function (member) {

        member.get("chatIds").push(storyId);
        chatMembers.push(member);

    });

    return Parse.Object.saveAll(chatMembers);

  }).then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getAllMembers", function(req, res){
  let ID = req.params.admin;
  let memberDetails = {};

  return new Parse.Query(_class.Members).equalTo("userId", ID).find({useMasterKey:true})
  .then(function(membersDetails){

    memberDetails.members = dashboardHelper.MemberDetails(membersDetails);

    res.success(util.setResponseOk(memberDetails));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("getMembers", function(req, res){
  let ID = req.params.admin;
  let storyId = req.params.storyId;
  let memberDetails = {};
  let storyArray = [];
  storyArray.push(storyId);

  return new Parse.Query(_class.Members).equalTo("userId", ID)
  .notContainedIn("chatIds", storyArray).find({useMasterKey:true})
  .then(function(membersDetails){

    memberDetails.members = dashboardHelper.MemberDetails(membersDetails);

    res.success(util.setResponseOk(memberDetails));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("changeColorScheme", function(req, res){
  let ID = req.params.admin;
  let storyId = req.params.storyId;
  let topColor = req.params.topColor;
  let bottomColor = req.params.bottomColor;

  return new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey: true})
  .then(function(story){
    story.get("info").topColor = topColor;
    story.get("info").bottomColor = bottomColor;

    return story.save();

  }).then(function(saved){
    let story = saved.get("info");

    res.success(util.setResponseOk(story));

  }, function(error){

    util.handleError(res, error);

  });
});

Parse.Cloud.define("addAuthor", function(req, res){
  let ID = req.params.admin;
  let authorIds = req.params.itemIds;
  let storyId = req.params.storyId;

  return new Parse.Query(_class.Stories).equalTo("userId", ID).equalTo("objectId", storyId)
  .first({useMasterKey: true})
  .then(function(story){

    story.set("authorId", authorIds);
    return story.save();

  }).then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getAuthorsList", function(req, res){
  let ID = req.params.admin;
  let currentProject = req.params.currentProject;
  let projectArray = [];
  projectArray.push(currentProject);
  let authorDetails = {};

  return new Parse.Query(_class.Authors).containedIn("projectIds", projectArray).find({useMasterKey: true})
  .then(function(authors){

    authorDetails.authors = dashboardHelper.AuthorDetails(authors);

    res.success(util.setResponseOk(authorDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("editStory", function(req, res){
  let ID = req.params.admin;
  let storyId = req.params.storyId;
  let keywords = req.params.keywords;
  let summary = req.params.summary;
  let title = req.params.title;
  let _keywords = [];

  if (Array.isArray(keywords) !== true){
    if (keywords !== "") {
        _keywords = keywords.split(",");
    }
  }


return new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey: true})
.then(function(story){
    story.set("title", title);
    if (Array.isArray(keywords) !== true){
        story.set("keywords", _keywords);
    }
    story.set("summary", summary);

    return story.save();
    // story.set("authorId", authorId);
  }).then(function(story){

    res.success(util.setResponseOk(story));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getStoryDetails", function(req, res){
  let ID = req.params.admin;
  let projectId = req.params.projectId;
  let storyId = req.params.storyId;
  let projectArray = [];
  projectArray.push(projectId);
  let storyDetails = {};
  let _story = {};
  let colors = {};
  let _authors = [];
  let _products = [];

  return Parse.Promise.when(
      new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey: true}),
      new Parse.Query(_class.ArtWork).equalTo("itemId", storyId).first({useMasterKey: true}),
      new Parse.Query(_class.Feed).equalTo("projectId", projectId).equalTo("userId", ID).equalTo("type", type.FEED_TYPE.story).first({useMasterKey: true}),
      new Parse.Query(_class.Stories).equalTo("userId", ID).containedIn("projectIds", projectArray).find({useMasterKey: true}),
      new Parse.Query(_class.Authors).find({useMasterKey: true}),
      new Parse.Query(_class.Product).find({useMasterKey: true})
  ).then(function(story, artwork, feed, stories, authors, products){

    if (feed){
      storyDetails.feedId = feed.get("feedId");
    }
    _story = story;
    _authors = authors;
    _products = products;

    page = util.page(stories, storyId);

    colors = story.get("info");

    if (colors.topColor === "") {
        //use system default
        colors = type.DEFAULT.colors;

    } else {

        colors = story.get("info");

    }

    storyDetails.story = dashboardHelper.StoryDetails(story);
    storyDetails.next = page.next;
    storyDetails.previous = page.previous;
    storyDetails.colors = colors;

    if (artwork) {

        return new Parse.Query(_class.Stickers).equalTo("objectId", artwork.get("stickerId")).first({useMasterKey: true});

    } else {
        return "";
    }
  }).then(function(sticker){
    if (sticker !== ""){

      storyDetails.art = dashboardHelper.StickerItem(sticker);

    }else {

      storyDetails.art = "";

    }

    let author = _story.get("authorId");
    if (author !== "") {

      return new Parse.Query(_class.Authors).equalTo("objectId", _story.get("authorId")).first({useMasterKey:true});

    } else {

      return "empty";

    }
  }).then(function(author){

    if (author === "empty") {
        storyDetails.authorName = "";
        storyDetails.authorId = "";
    } else {
        storyDetails.authorName = author.get("name");
        storyDetails.authorId = author.id;
    }

    return new Parse.Query(_class.Projects).containedIn("objectId", _story.get("projectIds")).find({useMasterKey:true});
        // new Parse.Query(_class.Members).equalTo("chatIds", _story.id).find({useMasterKey:true})

  }).then(function(projects){

    let _currentProjects = dashboardHelper.CommonItems(projects);
    storyDetails.projects = _currentProjects;

    res.success(util.setResponseOk(storyDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getNormalStories", function(req, res){
  let ID = req.params.admin;
  let storiesDetails = {};
  let _allArtwork = [];
  let artWork = [];
  let combined = [];
  let storyArray = [];
  let storyDetails = {};

  return Parse.Promise.when(
    new Parse.Query(_class.Stories).equalTo("userId", ID).descending("createdAt").find({useMasterKey: true}),
    new Parse.Query(_class.ArtWork).find({useMasterKey: true})
  ).then(function(stories, artworks){

    _allArtwork = artworks;
    storyArray = stories;
    storyDetails.stories = dashboardHelper.Stories(stories);

    _.each(artworks, function (artwork) {

        artWork.push(artwork.get("stickerId"));

    });

    return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find({useMasterKey: true});

  }).then(function(stickers){


        _.each(_allArtwork, function (artwork, index) {

            _.each(stickers, function (sticker) {

                if (artwork.get("stickerId") === sticker.id) {

                  combined.push({
                      story: artwork.get("itemId"),
                      image: sticker.get("uri").url()
                  });
                }
            })
        });

        let newArray = storyArray.slice(0);

        _.each(combined, function(combine, combinedIndex){
          _.each(newArray, function(storyItem, index){
           if ( storyItem.id === combine.story) {
                newArray.splice(index, 1);
            }
          });
        });

        if (newArray.length > 0){
          storyDetails.noArtStories = dashboardHelper.Stories(newArray);
        }else {
          storyDetails.noArtStories = [];
        }
        storyDetails.combined = combined;

        res.success(util.setResponseOk(storyDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getStories", function(req, res){
  let ID = req.params.admin;
  let projectId = req.params.projectId;
  let projectArray = [];
  projectArray.push(projectId);
  let storiesDetails = {};
  let _latest = "";
  let _allArtwork = [];
  let artWork = [];
  let _allEpisodes = [];
  let combined = [];
  let storyArray = [];
  let storyDetails = {};

  return Parse.Promise.when(
    new Parse.Query(_class.Stories).equalTo("userId", ID).containedIn("projectIds", projectArray).descending("createdAt").find({useMasterKey: true}),
    new Parse.Query(_class.ArtWork).find({useMasterKey: true}),
    // new Parse.Query(_class.Feed).equalTo("projectId", projectId).equalTo("userId", ID).equalTo("type", type.FEED_TYPE.story).first({useMasterKey: true}),
    new Parse.Query(_class.Episodes).containedIn("projectId", projectArray).find({useMasterKey: true})
  ).then(function(stories, artworks, episodes){

    _allArtwork = artworks;
    storyArray = stories;
    storyDetails.stories = dashboardHelper.Stories(stories);

    _.each(episodes, function (episode) {
        _.each(stories, function (story) {
            if (episode.get("storyId") === story.id) {
                _allEpisodes.push({"episodeId": episode.id, "storyId": story.id});
            }
        });
    });

    storyDetails.episodes = _allEpisodes;

    _.each(artworks, function (artwork) {

        artWork.push(artwork.get("stickerId"));

    });

    return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find({useMasterKey: true});

  }).then(function(stickers){

    _.each(_allArtwork, function (artwork, index) {

        _.each(stickers, function (sticker) {

            if (artwork.get("stickerId") === sticker.id) {

              combined.push({
                  story: artwork.get("itemId"),
                  image: sticker.get("uri").url()
              });
            }
        })
    });

    let newArray = storyArray.slice(0);

    _.each(combined, function(combine, combinedIndex){
      _.each(newArray, function(storyItem, index){
       if ( storyItem.id === combine.story) {
            newArray.splice(index, 1);
        }
      });
    });

    if (newArray.length > 0){
      storyDetails.noArtStories = dashboardHelper.Stories(newArray);
    }else {
      storyDetails.noArtStories = [];
    }
    storyDetails.combined = combined;

    res.success(util.setResponseOk(storyDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getNormalPacks", function(req, res){
  let ID = req.params.admin;
  let packDetails = {};

  return new Parse.Query(_class.Packs).equalTo("userId", ID).ascending("createdAt")
  .find({useMasterKey: true}).then(function(packs){

    let packDetails = dashboardHelper.Packs(packs);

    packDetails.packs = packDetails;

    res.success(util.setResponseOk(packDetails));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("getReviewPacks", function(req, res){
  let packDetails = {};
  let condition = 1;
  let accountType = 2;

  return new Parse.Query(_class.Packs).equalTo("status", condition).equalTo("accountType", accountType).ascending("createdAt")
  .find({useMasterKey: true}).then(function(packs){

    let packDetails = dashboardHelper.Packs(packs);

    packDetails.packs = packDetails;

    res.success(util.setResponseOk(packDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getPacks", function(req, res){
  let ID = req.params.admin;
  let projectId = req.params.projectId;
  let projectArray = [];
  projectArray.push(projectId);
  let packDetails = {};

  return new Parse.Query(_class.Packs).equalTo("userId", ID)
  .containedIn("projectIds", projectArray).ascending("createdAt")
  .find({useMasterKey: true}).then(function(packs){

    let packDetails = dashboardHelper.Packs(packs);

    packDetails.packs = packDetails;

    res.success(util.setResponseOk(packDetails));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("removeProject", function(req, res){
  let ID = req.params.admin;
  let itemType = req.params.itemType;
  let itemId = req.params.itemId;
  let projectId = req.params.projectId;
  let elementArray = [];
  let PACK = "pack";
  let STORY = "story";
  let QUERY;

  if (itemType === PACK) {
      QUERY = _class.Packs;
  } else if (itemType === STORY) {
      QUERY = _class.Stories;
  }

  return new Parse.Query(QUERY).equalTo("userId", ID).equalTo("objectId", itemId).first({useMasterKey: true})
  .then(function(item){

    elementArray = item.get("projectIds");
    _.each(elementArray, function (element, index) {

        if (projectId === element){

            elementArray.splice(index, 1);

        }
    });

    item.set("projectIds", elementArray);
    return item.save();

  }).then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("addNewProject", function(req, res){
  let ID = req.params.admin;
  let itemType = req.params.itemType;
  let itemId = req.params.itemId;
  let itemIds = req.params.itemIds;
  let itemArray = [];
  let PACK = "pack";
  let STORY = "story";
  let QUERY;

  if (itemType === PACK) {
      QUERY = _class.Packs;
  } else if (itemType === STORY) {
      QUERY = _class.Stories;
  }

  return new Parse.Query(QUERY).equalTo("userId", ID).equalTo("objectId", itemId).first({useMasterKey: true})
  .then(function(item){
    console.log("HERE " + JSON.stringify(item));
    item.get("projectIds").push(itemIds);
    return item.save();

  }).then(function(saved){

    res.success(util.setResponseOk(saved));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("getProjectsList", function(req, res){
  const ID = req.params.admin;
  let currentProjects = req.params.currentProjects;
  let projectDetails = {};

  return new Parse.Query(_class.Projects).equalTo("userId", ID).notContainedIn("objectId", currentProjects).find({useMasterKey: true})
  .then(function(projects){

    let projectItems = dashboardHelper.Projects(projects);
    projectDetails.projects = projectItems;

    res.success(util.setResponseOk(projectDetails));

  }, function(error){

    util.handleError(res, error);

  })

})

Parse.Cloud.define("deleteSticker", function(req, res){
  const ID = req.params.admin;
  let stickerId = req.params.stickerId;

  return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first({useMasterKey: true})
  .then(function(sticker){
    sticker.destroy({
        success: function (object) {

          res.success(util.setResponseOk({status: "done"}));

        },
        error: function (error) {
          console.log("STICKER NOT DELETED");

          util.handleError(res, error);

        }
    });
  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("editSticker", function(req, res){
  const ID = req.params.admin;
  let packId = req.params.packId;
  let stickerId = req.params.stickerId;
  let name = req.params.name;
  let description = req.params.description;
  let meaning = req.params.meaning;
  let status = req.params.status;
  let categories = req.params.categories;
  let selected = req.params.selected;
  let selectedOption = req.params.selectedOption;
  let _newArray = [];
  let merged = [];
  let stickerDetails = {};

  if (selectedOption !== ""){
    _newArray = selectedOption.split(",");
     merged = _newArray.concat(selected);
  }else {
    merged = selected
  }

  return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first({useMasterKey: true})
  .then(function(sticker){
    sticker.set("name", name);
    sticker.set("localName", name);
    sticker.set("categories", merged);
    sticker.set("meaning", meaning);
    sticker.set("sold", status);
    sticker.set("description", description);

    return sticker.save();

  }).then(function(sticker){

    stickerDetails.sticker = dashboardHelper.StickerItem(sticker);
    stickerDetails.selected = sticker.get("categories");
    res.success(util.setResponseOk(stickerDetails));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("getStickerDetails", function(req, res){
  const ID = req.params.admin;
  const stickerId = req.params.stickerId;
  const packId = req.params.packId;
  const projectId = req.params.projectId;

  let stickerDetails = {};

  return Parse.Promise.when(
      new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first({useMasterKey: true}),
      new Parse.Query(_class.Categories).ascending("name").find({useMasterKey: true}),
      new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true}),
      new Parse.Query(_class.Feed).equalTo("projectId", projectId).equalTo("userId", ID).equalTo("type", type.FEED_TYPE.sticker).first({useMasterKey: true})

      // new Parse.Query(_class.Feed).equalTo("objectId", process.env.LATEST_STICKER).first(),
      // new Parse.Query(_class.Projects).equalTo("objectId", projectId).first({useMasterKey: true})
  ).then(function(sticker, categories, pack, feed){

    if (feed){
      stickerDetails.feedId = feed.get("feedId");
    }else {
      stickerDetails.feedId = "";
    }

    stickerDetails.sticker = dashboardHelper.StickerItem(sticker);
    stickerDetails.categories = dashboardHelper.Categories(categories);
    if (sticker.get("categories") !== []){

      stickerDetails.selected = sticker.get("categories");

    }else {

      stickerDetails.selected = [];

    }
    console.log("CATEGORIES SELECTED " + stickerDetails.selected);
    let col = pack.relation(_class.Packs);
    return col.query().find({useMasterKey: true});

  }).then(function(stickers){
    console.log("STICKERS " + JSON.stringify(stickers));

    _page = util.page(stickers, stickerId);
    stickerDetails.next = _page.next;
    stickerDetails.previous = _page.previous;

    res.success(util.setResponseOk(stickerDetails));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("editPack", function(req, res){

  const ID = req.params.admin;
  const packId = req.params.packId;
  const version = req.params.version;
  const name = req.params.name;
  const description = req.params.description;
  const keywords = req.params.keywords;
  const archive = req.params.archive;
  let _archive;
  let _keywords;
  let packDetails = {};

  if (Array.isArray(keywords) === true){
    _keywords = keywords;
  }else {
    if (keywords !== "") {
        _keywords = keywords.split(",");
    }else {
      _keywords = []
    }
  }

  if (archive === "true"){
    _archive = true;
  } else if (archive === "false"){
    _archive = false;
  }else if (archive === "") {
    _archive = false;
  }

  return new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true}).then(function(pack){

    console.log("PACK EDITED 1 " + JSON.stringify(pack));

    pack.set("description", description);
    pack.set("keywords", _keywords);
    pack.set("archived", _archive);
    pack.set("version", version);
    pack.set("name", name);

    return pack.save();

  }).then(function(pack){
    console.log("PACK EDITED " + JSON.stringify(pack));
    packDetails.pack = dashboardHelper.PackItem(pack);
    res.success(util.setResponseOk(packDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("addProductId", function(req, res){
  const ID = req.params.admin;
  const packId = req.params.packId;
  const selected = req.params.selected;
  let _stickers = [];

  return new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true}).then(function(pack){
    if (pack.get("productId") === ""){
      if (selected !== "free") {
          pack.set("productId", selected);
      } else {
          pack.set("productId", "free");
      }
    }else {
      return "";
    }


    return pack.save();

  }).then(function(pack){

    if (pack !== ""){
      return new Parse.Query(_class.Stickers).equalTo("parent", {
          __type: 'Pointer',
          className: _class.Packs,
          objectId: packId
      }).find();
    }else {
      return "";
    }


  }).then(function(stickers){

    if (stickers !== ""){
      _.each(stickers, function (sticker) {

          sticker.set("productId", selected);
          if (selected !== "free") {
              sticker.set("sold", true);
          } else {
              sticker.set("sold", false);
          }
          _stickers.push(sticker);

      });

      return Parse.Object.saveAll(_stickers);
    }else {
      return ""
    }

  }).then(function(stickers){

    res.success(util.setResponseOk(stickers));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("editPackDetails", function(req, res){

  const ID = req.params.admin;
  let packId = req.params.packId;
  let projectId = req.params.projectId;
  let _pack;
  let productDetails = {};
  let packDetails = {};

  console.log("PACK ID "+JSON.stringify(packId));

 Parse.Promise.when(
      new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true}),
      new Parse.Query(_class.Product).equalTo("userId", ID).find({useMasterKey: true})

  ).then(function(pack, productId){
    _pack = pack;
    packDetails.pack = dashboardHelper.PackItem(pack);

    if (productId !== undefined) {
        packDetails.productIds = dashboardHelper.CommonItems(productId);
    } else {
      packDetails.productIds = "";
    }

    return new Parse.Query(_class.Product).equalTo("objectId", pack.get("productId")).first({useMasterKey: true});

  }).then(function(productInfo){

    // if (productInfo !== undefined) {
    //     productDetails.name = productInfo.get("name");
    //     productDetails.id = productInfo.id
    // }

    if (_pack.get("productId") === "free") {

      productDetails.name = "FREE";
      productDetails.id = ""

    }else {
      if (productInfo !== undefined) {
          productDetails.name = productInfo.get("name");
          productDetails.id = productInfo.id
        }else {
          productDetails.name = "FREE";
          productDetails.id = ""

        }
    }

    packDetails.singleProduct = productDetails;
    res.success(util.setResponseOk(packDetails));

  }, function(error){

    util.handleError(res, error);

  })
});

Parse.Cloud.define("addStickers", function(req, res){

  const ID = req.params.admin;
  let packId = req.params.packId;
  // let projectId = req.params.projectId;
  let projectArray = [];
  // projectArray.push(projectId);
  let file = req.params.file;
  let fileDetails = [];
  let stickerDetails = [];
  let stickerCollection = {};
  let _previews = [];
  let bitmap = "";
  let originalName = "";
  let stickerName = "";

  return new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true})
  .then(function(pack){

    stickerCollection = pack;

          originalName = file.name;

          stickerName = originalName.substring(0, originalName.length - 4).replace(util.SPECIAL_CHARACTERS, "");

          return image2base64(file.path); // you can also to use url

  }).then(function (data) {
    console.log("DATA FROM BASE 64 " + JSON.stringify(data));
    let Sticker = new Parse.Object.extend(_class.Stickers);
    let sticker = new Sticker();

    console.log("COUNTER " + count++);

    let parseFile = new Parse.File(stickerName, { base64: data });

    sticker.set("name", stickerName);
    sticker.set("localName", stickerName);
    sticker.set("uri", parseFile);
    // sticker.set("preview", parseFilePreview);
    sticker.set("userId", ID);
    sticker.set("parent", pack);
    sticker.set("description", "");
    sticker.set("meaning", "");
    sticker.set("categories", []);
    sticker.set("flagged", false);
    sticker.set("archived", false);
    if (pack.get("productId") !== "") {
        sticker.set("sold", true);
        sticker.set("productId", pack.get("productId"));
    } else {
        sticker.set("sold", false);
        sticker.set("productId", "free");
    }
    sticker.set("version", pack.get("version"));

    fileDetails.push(file.path);

    return sticker.save();


  }).then(function (stickers) {

    return new Parse.Query(_class.Stickers).equalTo("parent", {
        __type: 'Pointer',
        className: _class.Packs,
        objectId: packId
    }).find();

  }).then(function(stickers){

    _.each(stickers, function (sticker) {

        let collection_relation = stickerCollection.relation(_class.Packs);
        collection_relation.add(sticker);

    });

    return stickerCollection.save();

  }).then(function(saved){

    if (fileDetails.length > 0){
        _.each(fileDetails, function (file) {
            //Delete tmp fil after upload
            let tempFile = file;
            fs.unlink(tempFile, function (err) {
                if (err) {
                    //TODO handle error code
                    console.log("-------Could not del temp" + JSON.stringify(err));
                }
                else {
                    console.log("SUUCCCEESSSSS IN DELETING TEMP");
                }
            });
        });
    }

    res.success(util.setResponseOk(true));

  }, function(error){

    util.handleError(res, error);

  })

});

Parse.Cloud.define("getPackReport", function(req, res){
  let packId = req.params.packId;
  let packfeed = {};
  let _stickers = [];

  return new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true})
  .then(function(pack){

    let _pack = dashboardHelper.PackItem(pack);

    packfeed.pack = _pack;

    let stickers = pack.relation(_class.Packs);
    return Parse.Promise.when(
        stickers.query().find({useMasterKey: true})
    );

  }).then(function(stickers){

    _.each(stickers, sticker => {

      stickerItem = dashboardHelper.Sticker(sticker)
      _stickers.push(stickerItem);

    });
    packfeed.stickers = _stickers;

    res.success(util.setResponseOk(packfeed));

  }, function(error){

    util.handleError(res, error);

  })
});

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
  let page;

  Parse.Promise.when(
       new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true}),
       new Parse.Query(_class.Reports).equalTo("itemId", packId).equalTo("read", false).find({useMasterKey: true})
  ).then(function(pack, reports){
    if (reports.length > 0){
      packfeed.reports = true;
    }else {
      packfeed.reports = false;
    }

    packInfo = pack;
    let _pack = dashboardHelper.PackItem(pack);

    packfeed.pack = _pack;

    let stickers = pack.relation(_class.Packs);
    return Parse.Promise.when(
        stickers.query().find({useMasterKey: true})
    );
    // return packRelation.query().limit(1000).ascending("name").find({useMasterKey: true});

  }).then(function(stickers){
    _.each(stickers, sticker => {

      stickerItem = dashboardHelper.Sticker(sticker)
      _stickers.push(stickerItem);

    });
    packfeed.stickers = _stickers;

    if (projectId){
      return Parse.Promise.when(
          new Parse.Query(_class.Packs).equalTo("userId", ID).containedIn("projectIds", packInfo.get("projectIds")).find({useMasterKey: true}),
          new Parse.Query(_class.Product).find({useMasterKey: true}),
          new Parse.Query(_class.Projects).containedIn("objectId", packInfo.get("projectIds")).limit(limit).find({useMasterKey: true})
      );
    }else {
      return Parse.Promise.when(
          new Parse.Query(_class.Packs).equalTo("userId", ID).find({useMasterKey: true}),
          new Parse.Query(_class.Product).find({useMasterKey: true}),
          new Parse.Query(_class.Projects).containedIn("objectId", packInfo.get("projectIds")).limit(limit).find({useMasterKey: true})
      );
    }


  }).then(function(packs, products, projects){

    page = util.page(packs, packId);
    packfeed.nextPack = page.next;
    packfeed.previousPack = page.previous;

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

  if (projectId){
    projectArray.push(projectId);
  }

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

  if (storyFormat){
    story.set("format", storyFormat);
  }else {
    story.set("format", "0");
  }

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
  let account = req.params.account;
  let projectArray = [];

  if (projectId){
    projectArray.push(projectId);
  }

  let PackCollection = new Parse.Object.extend(_class.Packs);
  let pack = new PackCollection();
  pack.set("name", packName);
  pack.set("description", packDescription);
  pack.set("userId", ID);
  pack.set("status", type.PACK_STATUS.pending);
  pack.set("version", version);
  pack.set("projectIds", projectArray);
  pack.set("productId", "free");
  pack.set("archived", false);
  pack.set("flagged", false);
  pack.set("published", false);
  pack.set("previews", []);
  pack.set("accountType", account);

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
});

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

Parse.Cloud.define("getNormalHomeFeed", function(req, res){
  const ADMIN = req.params.admin;
  let homeFeed = {};
  let _stories;
  let _packs;
  let combined = [];
  let _allArtwork = [];
  let storyArray = [];
  let artWork = [];

  Parse.Promise.when(
    new Parse.Query(_class.Packs).equalTo("userId", ADMIN).descending("createdAt").find({useMasterKey: true}),
    new Parse.Query(_class.Stickers).equalTo("userId", ADMIN).count({useMasterKey: true}),
    new Parse.Query(_class.Stories).equalTo("userId", ADMIN).descending("createdAt").find({useMasterKey: true}),
    new Parse.Query(_class.ArtWork).find({useMasterKey: true})
  ).then(function(packs, stickers, stories, artworks){

    _allArtwork = artworks;
    storyArray = stories;

    homeFeed.stories = dashboardHelper.Stories(stories);
    _packs = dashboardHelper.Packs(packs);

    homeFeed.packs = _packs;

    _.each(artworks, function (artwork) {

        artWork.push(artwork.get("stickerId"));

    });

    return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find({useMasterKey: true});

  }).then(function(stickers){
    _.each(_allArtwork, function (artwork, index) {

        _.each(stickers, function (sticker) {

            if (artwork.get("stickerId") === sticker.id) {

              combined.push({
                  story: artwork.get("itemId"),
                  image: sticker.get("uri").url()
              });
            }
        })
    });

    let newArray = storyArray.slice(0);

    _.each(combined, function(combine, combinedIndex){
      _.each(newArray, function(storyItem, index){
       if ( storyItem.id === combine.story) {
            newArray.splice(index, 1);
        }
      });
    });

    if (newArray.length > 0){
      homeFeed.noArtStories = dashboardHelper.Stories(newArray);
    }else {
      homeFeed.noArtStories = [];
    }
    homeFeed.artStories = combined;

    res.success(util.setResponseOk(homeFeed));

  }, function(error){

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
  let stickerId = "";
  let _collections = [];
  let _stories = [];
  let _allAdverts = [];
  let _projects = [];
  let _projectItem = [];
  let _jokes = [];
  let _quotes = [];
  let _news = [];
  let _history = [];
  let _facts = [];
  let _episodes = [];
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

            if (collection){
               _collections = dashboardHelper.CommonItems(collection);
            }
            if (story){
              _stories = dashboardHelper.StoryTitles(story);
            }
            if (allAdverts){
              _allAdverts = dashboardHelper.StoryTitles(allAdverts);
            }
            if (projects){
              _projects = dashboardHelper.CommonItems(projects);
            }
            if (projectItem){
              _projectItem = dashboardHelper.ProjectItem(projectItem);
            }
            if (jokes){
               _jokes = dashboardHelper.StoryTitles(jokes);
             }
            if (quotes){
              _quotes = dashboardHelper.StoryTitles(quotes);
            }
            if (news){
              _news = dashboardHelper.StoryTitles(news);
            }
            if (history){
              _history = dashboardHelper.StoryTitles(history);
            }
            if (facts){
              _facts = dashboardHelper.StoryTitles(facts);
            }
            if (episodes){
             _episodes = dashboardHelper.StoryTitles(episodes);
            }

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

            if (latestStory && sticker) {
                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first({useMasterKey: true}),
                    new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first({useMasterKey: true}),
                    new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first({useMasterKey: true})
                );
            } else if (sticker === undefined && latestStory !== undefined) {
              console.log("ENTERED FIRST LAP");
                return Parse.Promise.when(
                    undefined,
                    new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first({useMasterKey: true}),
                    new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first({useMasterKey: true})
                );
            } else if (latestStory === undefined && sticker !== undefined) {
                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first({useMasterKey: true}),
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

              return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first({useMasterKey: true});

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

           res.success(util.setResponseOk(homeFeed));

        }, function(error){

          util.handleError(res, error);

        })
});

Parse.Cloud.define("getHomeStickers", function (req, res) {

    new Parse.Query(_class.Packs).equalTo("objectId", process.env.DEFAULT_PACK).first({useMasterKey: true})
    .then(function (pack) {

        if (pack) {

            let col = pack.relation(_class.Packs);
            return col.query().limit(40).find({useMasterKey: true});

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
