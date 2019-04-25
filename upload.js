const IncomingForm = require('formidable').IncomingForm;

module.exports = function upload(req, res) {
  var form = new IncomingForm()

  form.on('file', (field, file) => {

    console.log("FILE PATH AS EXPECTED " + JSON.stringify(file));

  });

  form.on('field', (field, name) => {
    console.log("FILE PATH AS EXPECTED " + JSON.stringify(name));
  });
  
  form.on('end', () => {
    res.json()
  });

  form.parse(req)
};
