$(document).ready(function () {
    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows:false
        }
    );

    //Create User in Parse
    Parse.initialize("dash-stickers");
    Parse.serverURL = 'https://sticker-dashboard.herokuapp.com/parse/';

    var user = Parse.User;
    user.set("username", "cyfa12");
    user.set("password", "hash$1");

    $('#loginSubmit').click(function()
    {
        //check empty fields before proceeding
        if($('#uname').val = '')
        {

        }
        user.logIn();
    })
});

//Create User in Parse
Parse.initialize("dash-stickers");
Parse.serverURL = 'https://sticker-dashboard.herokuapp.com/parse/';

var user = Parse.User;
user.set("username", "cyfa12");
user.set("password", "hash$1");

function signIn (uname, password)
{
    user.signUp().then(function(success)
    {
        user.logIn(uname, password).then(
            function success()
            {
                window.location.href = "/dashboard";
            }
        )
    });
}
