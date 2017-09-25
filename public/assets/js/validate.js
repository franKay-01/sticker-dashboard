Parse.initialize("d55f9778-9269-40c2-84a2-e0caaf2ad87a");
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';


getCookie = function (cname) {
    var name = cname + "=";
    console.log("Document Cookie "+ document.cookie);
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

        token = "r:"+token.substring(2);
        Parse.User.become(token).then(function () {
                console.log("Current user::::::" + Parse.User.current());
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

 function logoutUser() {
   Parse.User.logOut().then(function () {
       location.href = "/logout";
   });
}

//check if details form has been edited before availing update button































