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
//console.log("token------"+token);
if (token !== "") {
    var user = Parse.User.current();
    if (!(user === null)) {
        var sessToken = user.getSessionToken();
        user.become(sessToken).then(function(val){
            console.log("user's token = " + val);
                console.log("cookies: " + req.body.cookies);
            },
            function (error) {

            alert(JSON.stringify(error));
               // window.location = "https://cryptic-waters-41617.herokuapp.com/";

         });
    }
    else
    {
        function getUserToken()
        {
            Parse.User.become()
            console.log("cookies: " + req.body.cookies);
        }
        console.log("no token gotted");
    }
}