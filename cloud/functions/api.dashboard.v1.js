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

  if (keywords.length > 0) {
      _keywords = keywords.split(",");
  }

return new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey: true})
.then(function(story){
    story.set("title", title);
    if (keywords.length > 0) {
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

    if (productInfo !== undefined) {
        productDetails.name = productInfo.get("name");
        productDetails.id = productInfo.id
    }

    if (_pack.get("productId") === "free") {

      productDetails.name = "FREE";
      productDetails.id = ""

    }else {

      productDetails.name = productInfo.get("name");
      productDetails.id = productInfo.id

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
  let projectId = req.params.projectId;
  let projectArray = [];
  projectArray.push(projectId);
  let files = req.params.pictures;
  let fileDetails = [];
  let stickerDetails = [];
  let stickerCollection = {};
  let _previews = [];

  return new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true}).then(function(pack){

    stickerCollection = pack;

      files.forEach(function (file, index) {
          console.log("FILE NAME " + file.name);
          console.log("FILE TYPE " + file.type);
          let fileUrl = file.url;
          fileUrl = fileUrl.split(';base64,').pop();
          fileUrl = new Buffer(fileUrl, 'base64');

          let Sticker = new Parse.Object.extend(_class.Stickers);
          let sticker = new Sticker();

          // fullName = fullName.replace(util.SPECIAL_CHARACTERS, '');
          let originalName = file.name;
          let stickerName = originalName.substring(0, originalName.length - 4).replace(util.SPECIAL_CHARACTERS, "");

          // let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

          let bitmapPreview;
          let parseFilePreview = "";

          // _.map(_previews, preview => {
          //     if (stickerName === preview.name) {
          //         bitmapPreview = fs.readFileSync(preview.path, {encoding: 'base64'});
          //         parseFilePreview = new Parse.File(stickerName, {base64: bitmapPreview}, preview.mimetype);
          //     }
          // });

          let parseFile = new Parse.File(stickerName, fileUrl, file.type);
          console.log("PARSEFILE FOR SAVE " + JSON.stringify(parseFile));

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
          console.log("STICKER FOR SAVE " + JSON.stringify(sticker));
          stickerDetails.push(sticker);

    })

    console.log("SAVE ALL OBJECTS AND FILE");
    return Parse.Object.saveAll(stickerDetails);

  }).then(function (stickers) {

    _.each(stickers, function (sticker) {

        let collection_relation = stickerCollection.relation(_class.Packs);
        collection_relation.add(sticker);

    });

    return stickerCollection.save();

  }).then(function(saved){

    res.success(util.setResponseOk(saved));

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

  return new Parse.Query(_class.Packs).equalTo("objectId", packId).first({useMasterKey: true})
  .then(function(pack){
    packInfo = pack;
    console.log("PACK DETAILS " + JSON.stringify(pack));
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

    return Parse.Promise.when(
        new Parse.Query(_class.Packs).equalTo("userId", ID).containedIn("projectIds", packInfo.get("projectIds")).find(),
        new Parse.Query(_class.Product).find(),
        new Parse.Query(_class.Projects).containedIn("objectId", packInfo.get("projectIds")).limit(limit).find()
    );

  }).then(function(packs, products, projects){

    page = util.page(packs, packId);
    console.log("PAGES " + JSON.stringify(page));
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
  let stickerId = "";
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

            if (latestStory && sticker) {
                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first({useMasterKey: true}),
                    new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first({useMasterKey: true}),
                    new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first({useMasterKey: true})
                );
            } else if (sticker === undefined) {
              console.log("ENTERED FIRST LAP");
                return Parse.Promise.when(
                    undefined,
                    new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first({useMasterKey: true}),
                    new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first({useMasterKey: true})
                );
            } else if (latestStory === undefined) {
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
           console.log("FINISHED LAST " + JSON.stringify(homeFeed));
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
