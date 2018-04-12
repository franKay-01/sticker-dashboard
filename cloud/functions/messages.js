let util = require("../modules/util");
let helpers = require("../modules/helpers");
let type = require("../modules/type");

let MessageClass = "messages";

Parse.Cloud.define("message", function (req, res) {

    let name = req.params.name;
    let subject = req.params.subject;
    let email = req.params.email;
    let message = req.params.message;
    let type = parseInt(req.params.type);

    switch(String(type).toLowerCase()){

        case "visitor" :
            type = type.MESSAGES.visitor;
            break;

        case "creator" :
            type = type.MESSAGES.creator;
            break;

        case "brand" :
            type = type.MESSAGES.brand;
            break;



    }

    let Contact = new Parse.Object.extend(MessageClass);
    let contact = new Contact();

    contact.set("name", name);
    contact.set("subject", subject);
    contact.set("email", email);
    contact.set("message", message);
    contact.set("type", source);
    contact.set("read", false);

    contact.save({useMasterKey:true}).then(function () {

        res.success();

    }, function (error) {

        //TODO add error messages for
        util.handleError(res, error);
    })

});
