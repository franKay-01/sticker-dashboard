Parse.initialize("d55f9778-9269-40c2-84a2-e0caaf2ad87a");
//TODO decide on a way to switch to different environments
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';


function deleteAllCookies() {
    let cookies = document.cookie.split(";");
    console.log("COOKIES TO BE DELETED "+cookies);
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        let eqPos = cookie.indexOf("=");
        let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

function logoutUser() {
    deleteAllCookies();
    Parse.User.logOut().then(function () {
     document.location = "/account/logout";
    });
}


//check if details form has been edited before availing update button































