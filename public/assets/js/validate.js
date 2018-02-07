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

var token = getCookie("tk");
// var _session = session.getAttribute("_token");
// console.log("SESSION " + JSON.stringify(_session));

if (token !== "") {

    if (Parse.User.current() === null) {
        token = "r:"+token.substring(2);
        console.log("TOKEN FROM USER "+JSON.stringify(token));
        Parse.User.become(token,{
            success:function(){
                console.log("Current user::::::" + Parse.User.current());
            },
            error:function(error){
                console.log("Not become:::"+ error.message);
            }
        });
    }
    else
    {
        console.log("Current user::::::" + Parse.User.current());
    }
}


function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

function logoutUser() {
    Parse.User.logOut().then(function () {
        deleteAllCookies();
        location.href = "/logout";
    });
}

//check if details form has been edited before availing update button































