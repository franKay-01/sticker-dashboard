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
        user.set("username", "engmann");
        user.set("password", "12elve");
        console.log(Parse.User.current());

        //input fields
    var uname = $('#uname').val();
    var passwd = $("#pwd").val();

        $('#loginSubmit').click(function()
        {
            if(uname == "" || passwd == "")
            {
                window.alert("Fill fields first");
            }
            else
            {
                user.logIn(uname, passwd).then(function success()
                    {
                        window.alert("success login");
                    },
                    function err(error)
                    {
                        console.error(error);
                    });
            }
        });

}
);



