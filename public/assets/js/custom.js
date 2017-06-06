// //import parse dependencies
// var Parse = require("parse");
// var ParseServer = require('parse-server').ParseServer;

$(document).ready(function () {
    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows: false
        }
    );

//        Create User in Parse
        Parse.initialize("cryptic-waters12");
        Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';

        var user = Parse.User();
        user.set("username", "engmann");
        user.set("password", "12elve");
        console.log(Parse.User.current());

        $('#loginSubmit').click(function()
        {
            user.logIn("engmann", "12elve").then(function()
            {
                alert("success login");
            },
            function err(error)
            {
                console.error(error);
            });
        });

}
);



