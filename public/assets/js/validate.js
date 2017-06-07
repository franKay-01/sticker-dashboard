
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

if (token !== "") {
    if (Parse.User.current() === null) {
        Parse.User.become(getCookie("token")).then(function(){},

            function () {

                window.location = "https://cryptic-waters-41617.herokuapp.com/login";

         });
    }
}