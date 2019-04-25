const IncomingForm = require('formidable').IncomingForm;

module.exports = function upload(req, res) {
  var form = new IncomingForm()

  form.on('file', (field, file) => {

    console.log("FILE PATH AS EXPECTED " + JSON.stringify(file));
    console.log("FILE FIELD AS EXPECTED " + JSON.stringify(field));

  });

  form.on('name', (field, file) => {

    console.log("FILE PATH AS EXPECTED " + JSON.stringify(file));
    console.log("FILE FIELD AS EXPECTED " + JSON.stringify(field));

  });

  form.on('end', () => {
    res.json()
  });

  form.parse(req)
};
