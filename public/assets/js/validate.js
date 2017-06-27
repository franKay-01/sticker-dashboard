Parse.initialize("cryptic-waters12");
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';


getCookie = function (cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(name) !== -1) return c.substring(name.length, c.length);
    }
    return undefined;
};

var token = getCookie("token");

if (token !== "") {

    if (Parse.User.current() === null) {
        console.log("Current user::::::" + Parse.User.current());
        Parse.User.become(token).then(function () {
                //do nothing
                //Parse.User.current is available
            },
            function (error) {

                //TODO handle error with an Alert
                console.log("Not become:::"+ error.message);
                console.log("Token:::"+ token);

            });
    }
    else
    {
        console.log("Current user::::::" + Parse.User.current());
    }
}

// var logoutBtn =  documnet.getElementById('signout');
 function logoutUser() {
   Parse.User.logOut().then(function () {
       location.href = "/logout";
   });
}