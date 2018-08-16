let Parse = require("parse/node").Parse; // import the module
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;

module.exports = {
    login: function (username, password) {
        Parse.Cloud.run("login", {
            username: username,
            password: password
        }).then(user => {

            Parse.User.become(user.getSessionToken()).then((user) => {

              return user.getSessionToken().getUsername();

            }, error => {
                return "Error";
            })

        })
    }
};
