let util = require("../modules/util");
let helpers = require("../modules/helpers");
let _type = require("../modules/type");

let ContactClass = "Contact";

Parse.Cloud.define("message", function (req, res) {

    let name = req.params.name;
    let subject = req.params.subject;
    let email = req.params.email;
    let message = req.params.message;
    let type = String(req.params.type).toLowerCase();

    switch (type) {

        case "visitor" :
            type = _type.MESSAGES.visitor;
            break;

        case "creator" :
            type = _type.MESSAGES.creator;
            break;

        case "brand" :
            type = _type.MESSAGES.brand;
            break;

    }

    let Contact = new Parse.Object.extend(ContactClass);
    let contact = new Contact();

    contact.set("name", name);
    contact.set("subject", subject);
    contact.set("email", email);
    contact.set("message", message);
    contact.set("type", type);
    contact.set("read", false);

    contact.save({useMasterKey: true}).then(function () {

        res.success(util.setSuccess());

    }, function (error) {

        //TODO add error messages for
        util.handleError(res, error);
    })

});
