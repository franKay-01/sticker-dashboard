let util = require("../modules/util");
let helpers = require("../modules/helpers");


let MessageClass = "messages";

Parse.Cloud.define("message", function (req, res) {

    let token = req.cookies.token;
    let name = req.params.name;
    let subject = req.params.subject;
    let email = req.params.email;
    let message = req.params.message;
    //TODO Create Type table
    let type = parseInt(req.params.source);

    let Contact = new Parse.Object.extend(MessageClass);
    let contact = new Contact();

    contact.set("name", name);
    contact.set("subject", subject);
    contact.set("email", email);
    contact.set("message", message);
    contact.set("type", source);
    contact.set("read", false);

    contact.save().then(function () {

        res.success();

    }, function (error) {

        //TODO add error messages for
        util.handleError(res, error);
    })

});
