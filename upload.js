let fs = require('fs');
let _ = require('underscore');
let _class = require('./cloud/modules/classNames');
const IncomingForm = require('formidable').IncomingForm;

module.exports = function upload(req, res) {
  let form = new IncomingForm()
  let packId = "";
  let user = "";
  let fileDetails = [];

  form.on('field', (field, items) => {
    packId = items[0];
    user = items[1];
  });

  form.on('file', (field, file) => {
    Parse.Cloud.run("addStickers",{
      admin: user,
      file: file,
      packId: packId
    }).then(function(sticker){
      console.log(JSON.stringify(sticker));
    }, function(error){
      console.log("ERROR " + error.message);
    })
  });

  form.on('end', () => {
    res.json()
  });

  form.parse(req)
};
