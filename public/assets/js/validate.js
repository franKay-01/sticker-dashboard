Parse.initialize("cryptic-waters12");
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';


// getCookie = function (cname) {
//     var name = cname + "=";
//     var ca = document.cookie.split(';');
//     for (var i = 0; i < ca.length; i++) {
//         var c = ca[i];
//         while (c.charAt(0) === ' ') c = c.substring(1);
//         if (c.indexOf(name) !== -1) return c.substring(name.length, c.length);
//     }
//     return undefined;
// };

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

var token = getCookie("token");
console.log("token------"+token);
if (token !== "") {
    if (Parse.User.current() === null) {
        // var user = Parse.User.current();
        // var sessionToken = user.getSessionToken();
        // console.log("User's token: " + sessionToken);
        Parse.User.become(token).then(function(val){
            console.log("success------"+val);
            },
            function (error) {
            alert("error====="+JSON.stringify(error));

         });
    } else {

        alert("already a parse user"+Parse.User.current().getSessionToken());

    }
}