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
