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

        Parse.initialize("cryptic-waters12");
        Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';

    //log user out
        function logOut()
        {
            Parse.User.logOut().then(function()
            {
                alert("Logged out");
                window.location ="https://cryptic-waters-41617.herokuapp.com/";
            });
        }

        //call logOut function when button is clicked
        $("#signout").click(logOut());
        console.log(Parse.User.current());


        $('#loginSubmit').click(function()
        {
            if(!($("#uname").val()) || !($("#pwd").val()))
            {
                window.alert("Fill fields first");
            }
            else
            {
                Parse.User.logIn($("#uname").val(), $("#pwd").val()).then(function success()
                    {
                        window.location ="https://cryptic-waters-41617.herokuapp.com/dashboard";
                    },
                    function err(error)
                    {
                        console.error(error);
                    });
            }
            console.log($("#uname").val() + $("#pwd").val());
        }
        );
}
);



