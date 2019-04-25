let fs = require('fs');
let _ = require('underscore');
let _class = require('./cloud/modules/classNames');
const IncomingForm = require('formidable').IncomingForm;

module.exports = function upload(req, res) {
  let form = new IncomingForm()
  let packId = "";
  let fileDetails = [];

  form.on('field', (field, id) => {
    packId = id;
  });

  form.on('file', (field, file) => {

    return new Parse.Query(_class.Packs).equalTo("objectId", packId).first()
    .then(function(pack){
      // stickerCollection = pack;

          let Sticker = new Parse.Object.extend(_class.Stickers);
          let sticker = new Sticker();

          // fullName = fullName.replace(util.SPECIAL_CHARACTERS, '');
          let originalName = file.name;
          let stickerName = originalName.substring(0, originalName.length - 4).replace(util.SPECIAL_CHARACTERS, "");

          let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

          let bitmapPreview;

          //create our parse file
          let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.type);
          console.log("PARSE FILE " + JSON.stringify(parseFile));

          sticker.set("name", stickerName);
          sticker.set("localName", stickerName);
          sticker.set("uri", parseFile);
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
          fileDetails.push(file);

          return sticker.save();

    }).then(function(sticker){

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
    })

  });

  form.on('end', () => {
    res.json()
  });

  form.parse(req)
};
