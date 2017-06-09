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
    if (Parse.User.current() === null) {
        Parse.User.become("r:d9fd28d685da4ce50943887525887951").then(function(val){
            console.log("value------"+val);
            },

            function (error) {

            alert(JSON.stringify(error));
               // window.location = "https://cryptic-waters-41617.herokuapp.com/";

         });
    }
    else
    {
        function cookies()
        {
            console.log("cookies: " + req.body.cookies);
        }
        console.log("current user: " + JSON.stringify(Parse.User.current()));
    }
}