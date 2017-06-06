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

        var user = new Parse.User();
        console.log(Parse.User.current());
        $("#signout").click(function()
        {
            user.logOut().then(function()
            {
                alert("Logged out");
                window.location("https://cryptic-waters-41617.herokuapp.com/");
            });
        });

        //input fields
    var uname = $("#uname").val();
    var passwd = $("#pwd").val();

        $('#loginSubmit').click(function()
        {
            if(!uname || !passwd)
            {
                window.alert("Fill fields first");
            }
            else
            {
                user.logIn(uname, passwd).then(function success()
                    {
                        window.location("https://cryptic-waters-41617.herokuapp.com/dashboard");
                    },
                    function err(error)
                    {
                        console.error(error);
                    });
            }
        });
}
);



