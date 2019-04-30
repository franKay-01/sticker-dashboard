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
  app.get('/uploads/react/:id/:projectId', function (req, res) {

      let pack_id = req.params.id;
      let projectId = req.params.projectId;

      return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first()
      .then(function (pack) {
          res.render("pages/stickers/react_stickers", {
              id: pack.id,
              pack_name: pack.get("name"),
              projectId: projectId
            });
          }, function (error) {
              res.redirect("http://localhost:3000/pack/"+pack_id+"/"+projectId);
          })

  });

  app.post('/uploads/react', upload.array('im1[]'), function (req, res) {

      let pack_id = req.body.pack_id;
      let projectId = req.body.projectId;
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
                      // sticker.set("userId", _user.id);
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
