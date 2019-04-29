let fs = require('fs');
let _ = require('underscore');
let _class = require('./cloud/modules/classNames');
const IncomingForm = require('formidable').IncomingForm;

module.exports = function upload(req, res) {
  let form = new IncomingForm()
  form.uploadDir = "./public/uploads";
  let packId = "";
  let user = "";
  let fileDetails = [];
  let newArray = [];

  form.on('field', (field, items) => {
    newArray = items.split(",");
    packId = newArray[0];
    user = newArray[1];
  });

  form.on('file', (field, file) => {
    Parse.Cloud.run("addStickers",{
      admin: user,
      file: file,
      packId: packId
    })
  });

  form.on('end', () => {
    res.json("Happy");
  });

  form.parse(req)
};
