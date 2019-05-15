let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let _ = require('underscore');
let type = require('../cloud/modules/type');
let multer = require('multer');
let fs = require('fs');
let download = require('image-downloader');

const PARSE_LIMIT = 2000;

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("Dest " + JSON.stringify(file));
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

let upload = multer({storage: storage});

module.exports = function (app) {
  // This is to upload images for change of storyItems.
  app.get('/change_image/react/:itemId/:url', function (req, res) {
    let itemId = req.params.itemId;
    let url = req.params.url;
    let backUrl = Buffer.from(url, 'base64').toString();

    return new Parse.Query(_class.StoryItems).equalTo("objectId", itemId).first({useMasterKey: true})
    .then(function (storyItem) {
      //TODO find out if the item being changed is an image. If yes remove the previous image
        res.render("pages/stickers/change_react_image", {
            itemId: storyItem.id,
            itemTitle: "Changing Image Item",
            back: backUrl,
            url: url
          });
        }, function (error) {
            url = atob(url);
            res.redirect(url.toString());
        })
  })

  app.post("/change_image/react", upload.array('im1'), function(req, res){
    let storyId = req.body.storyId;
    let memberId = req.body.memberId;
    let url = req.body.url;
    let backUrl = Buffer.from(url, 'base64').toString();
    let files = req.files;
    let _storyItem;
    return new Parse.Query(_class.StoryItems).equalTo("objectId", storyId).first({useMasterKey:true})
    .then(function(storyItem){
      _storyItem = storyItem;

      let Asset = new Parse.Object.extend(_class.Assets);
      let asset = new Asset();

      let fullName = files[0].originalname;
      let stickerName = fullName.substring(0, fullName.length - 4);

      let bitmap = fs.readFileSync(files[0].path, {encoding: 'base64'});

      let parseFile = new Parse.File(stickerName, {base64: bitmap}, files[0].mimetype);

      asset.set("uri", parseFile);

      return asset.save();
    }).then(function(asset){

      _storyItem.set("type", type.STORY_ITEM.image);
      _storyItem.set("contents", {"uri": asset.get("uri").url(), "id": asset.id});

      return _storyItem.save();

    }).then(function(){
      if (files.length > 0) {
          let tempFile = files[0].path;
          fs.unlink(tempFile, function (err) {
              if (err) {
                  //TODO handle error code
                  console.log("-------Could not del temp" + JSON.stringify(err));
              }
              else {
                  console.log("SUUCCCEESSSSS IN DELTEING TEMP");
              }
          });
      }

      res.redirect(backUrl);

    }, function(error){

      res.redirect(backUrl);

    });
  });
  // This is to upload images for the admin Packs.
  app.get('/uploads/react/:id/:projectId/:userId', function (req, res) {

      let pack_id = req.params.id;
      let projectId = req.params.projectId;
      let user = req.params.userId;

      return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first({useMasterKey:true})
      .then(function (pack) {
          res.render("pages/stickers/react_stickers", {
              id: pack.id,
              pack_name: pack.get("name"),
              projectId: projectId,
              userId: user
            });
          }, function (error) {
              res.redirect("http://localhost:3000/pack/"+pack_id+"/"+projectId+"/"+user);
          })

  });

  app.post('/upload/image/react', upload.array('im1'), function(req, res){
    let storyId = req.body.storyId;
    let memberId = req.body.memberId;
    let files = req.files;

    let Asset = new Parse.Object.extend(_class.Assets);
    let asset = new Asset();

    let fullName = files[0].originalname;
    let stickerName = fullName.substring(0, fullName.length - 4);

    let bitmap = fs.readFileSync(files[0].path, {encoding: 'base64'});

    //create our parse file
    let parseFile = new Parse.File(stickerName, {base64: bitmap}, files[0].mimetype);

    asset.set("uri", parseFile);

    return asset.save().then(function(image){

      let Story = new Parse.Object.extend(_class.StoryItems);
      let catalogue = new Story();

      catalogue.set("type", type.STORY_ITEM.image);
      if (memberId === "none"){
      catalogue.set("contents", {"uri": image.get("uri").url(), "id": image.id});
      }else {
      catalogue.set("contents", {"uri": image.get("uri").url(), "id": image.id, "character": memberId});
      }
      catalogue.set("storyId", storyId);

      return catalogue.save();

    }).then(function(){

      let tempFile = files[0].path;
      fs.unlink(tempFile, function (err) {
          if (err) {
              //TODO handle error code
              console.log("-------Could not del temp" + JSON.stringify(err));
          }
          else {
              console.log("SUUCCCEESSSSS IN DELTEING TEMP");
          }
      });

    res.redirect("http://localhost:3000/storyitem/story/"+storyId+"/undefined");

  }, function(error){

    res.redirect("http://localhost:3000/storyitem/story/"+storyId+"/undefined");

    });
  })

  // This is to upload images for the storyItems
  app.get('/upload/image/react/:storyId/:memberId', function (req, res) {
    let storyId = req.params.storyId;
    let memberId = req.params.memberId;

    return new Parse.Query(_class.Stories).equalTo("objectId", storyId).first({useMasterKey:true})
    .then(function (story) {
        res.render("pages/stickers/react_story_image", {
            storyId: story.id,
            storyName: story.get("title"),
            memberId: memberId
          });
        }, function (error) {
            res.redirect("http://localhost:3000/storyitem/story/"+storyId+"/"+memberId);
        })
  });

  // This is to upload images for the normal Packs. That is for individuals who sign up as third parties
  app.get('/uploads/normal/react/:id/:userId', function (req, res) {

      let pack_id = req.params.id;
      let projectId = req.params.projectId;
      let user = req.params.userId;

      return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first({useMasterKey:true})
      .then(function (pack) {
          res.render("pages/stickers/react_normal_stickers", {
              id: pack.id,
              pack_name: pack.get("name"),
              projectId: projectId,
              userId: user
            });
          }, function (error) {
              res.redirect("http://localhost:3000/normalPacks/"+pack_id+"/"+user);
          })

  });

  app.post('/uploads/normal/react', upload.array('im1[]'), function (req, res) {

      let pack_id = req.body.pack_id;
      let userId = req.body.userId;
      let files = req.files;
      let fileDetails = [];
      let stickerDetails = [];
      let stickerCollection = {};
      let _previews = [];
      let pack = "/pack/";

      // if (token) {
      //
      //     let _user = {};
      //
      //     util.getUser(token).then(function (sessionToken) {
      //
      //         _user = sessionToken.get("user");
      //         //TODO implement DRY for thumbnails
              util.thumbnail(files).then(previews => {

                  _previews = previews;

                  return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

              }).then(function (pack) {

                  stickerCollection = pack;

                  files.forEach(function (file) {

                      let Sticker = new Parse.Object.extend(_class.Stickers);
                      let sticker = new Sticker();


                      // fullName = fullName.replace(util.SPECIAL_CHARACTERS, '');
                      let originalName = file.originalname;
                      let stickerName = originalName.substring(0, originalName.length - 4).replace(util.SPECIAL_CHARACTERS, "");
                      console.log("FILE PATH ###" + file.path);
                      let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                      let bitmapPreview;
                      let parseFilePreview = "";

                      _.map(_previews, preview => {
                          if (stickerName === preview.name) {
                              bitmapPreview = fs.readFileSync(preview.path, {encoding: 'base64'});
                              parseFilePreview = new Parse.File(stickerName, {base64: bitmapPreview}, preview.mimetype);
                          }
                      });

                      //create our parse file
                      let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                      console.log("PARSE FILE " + JSON.stringify(parseFile));

                      sticker.set("name", stickerName);
                      sticker.set("localName", stickerName);
                      sticker.set("uri", parseFile);
                      sticker.set("preview", parseFilePreview);
                      sticker.set("userId", userId);
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

                      // sticker.setACL(setPermission(_user, false));

                      stickerDetails.push(sticker);
                      fileDetails.push(file);

                  });

                  console.log("SAVE ALL OBJECTS AND FILE");
                  return Parse.Object.saveAll(stickerDetails);

              }).then(function (stickers) {

                  _.each(fileDetails, function (file) {
                      //Delete tmp fil after upload
                      let tempFile = file.path;
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

                  return new Parse.Query(_class.Stickers).equalTo("parent", {
                      __type: 'Pointer',
                      className: _class.Packs,
                      objectId: pack_id
                  }).find();


                  //console.log("SAVE COLLECTION RELATION");


              }).then(function (stickers) {

                  // res.send("STICKERS " + stickers.length);

                  _.each(stickers, function (sticker) {

                      let collection_relation = stickerCollection.relation(_class.Packs);
                      collection_relation.add(sticker);

                  });

                  return stickerCollection.save();

              }).then(function (stickers) {

                  res.redirect("http://localhost:3000/normalPacks/"+pack_id);

              }, function (error) {

                  console.log("BIG BIG ERROR" + error.message);
                  res.redirect("http://localhost:3000/normalPacks/"+pack_id);

              });
          // }, function (error) {
          //     console.log("BIG BIG ERROR" + error.message);
          //     res.redirect("/");
          // });

      //
      // } else {
      //
      //     res.redirect("/");
      //
      // }
  });

  app.post('/uploads/react', upload.array('im1[]'), function (req, res) {

      let pack_id = req.body.pack_id;
      let projectId = req.body.projectId;
      let userId = req.body.userId;
      let files = req.files;
      let fileDetails = [];
      let stickerDetails = [];
      let stickerCollection = {};
      let _previews = [];
      let pack = "/pack/";

      // if (token) {
      //
      //     let _user = {};
      //
      //     util.getUser(token).then(function (sessionToken) {
      //
      //         _user = sessionToken.get("user");
      //         //TODO implement DRY for thumbnails
              util.thumbnail(files).then(previews => {

                  _previews = previews;

                  return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

              }).then(function (pack) {

                  stickerCollection = pack;

                  files.forEach(function (file) {

                      let Sticker = new Parse.Object.extend(_class.Stickers);
                      let sticker = new Sticker();


                      // fullName = fullName.replace(util.SPECIAL_CHARACTERS, '');
                      let originalName = file.originalname;
                      let stickerName = originalName.substring(0, originalName.length - 4).replace(util.SPECIAL_CHARACTERS, "");
                      console.log("FILE PATH ###" + file.path);
                      let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                      let bitmapPreview;
                      let parseFilePreview = "";

                      _.map(_previews, preview => {
                          if (stickerName === preview.name) {
                              bitmapPreview = fs.readFileSync(preview.path, {encoding: 'base64'});
                              parseFilePreview = new Parse.File(stickerName, {base64: bitmapPreview}, preview.mimetype);
                          }
                      });

                      //create our parse file
                      let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                      console.log("PARSE FILE " + JSON.stringify(parseFile));

                      sticker.set("name", stickerName);
                      sticker.set("localName", stickerName);
                      sticker.set("uri", parseFile);
                      sticker.set("preview", parseFilePreview);
                      sticker.set("userId", userId);
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

                      // sticker.setACL(setPermission(_user, false));

                      stickerDetails.push(sticker);
                      fileDetails.push(file);

                  });

                  console.log("SAVE ALL OBJECTS AND FILE");
                  return Parse.Object.saveAll(stickerDetails);

              }).then(function (stickers) {

                  _.each(fileDetails, function (file) {
                      //Delete tmp fil after upload
                      let tempFile = file.path;
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

                  return new Parse.Query(_class.Stickers).equalTo("parent", {
                      __type: 'Pointer',
                      className: _class.Packs,
                      objectId: pack_id
                  }).find();


                  //console.log("SAVE COLLECTION RELATION");


              }).then(function (stickers) {

                  // res.send("STICKERS " + stickers.length);

                  _.each(stickers, function (sticker) {

                      let collection_relation = stickerCollection.relation(_class.Packs);
                      collection_relation.add(sticker);

                  });

                  return stickerCollection.save();

              }).then(function (stickers) {

                  res.redirect("http://localhost:3000/pack/"+pack_id+"/"+projectId);

              }, function (error) {

                  console.log("BIG BIG ERROR" + error.message);
                  res.redirect("http://localhost:3000/pack/"+pack_id+"/"+projectId);

              });
          // }, function (error) {
          //     console.log("BIG BIG ERROR" + error.message);
          //     res.redirect("/");
          // });

      //
      // } else {
      //
      //     res.redirect("/");
      //
      // }
  });

}
