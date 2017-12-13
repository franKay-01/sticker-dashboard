function signUp() {
    var name = document.getElementById('name_field').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var confirm_password = document.getElementById('confirm_password').value;

    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }


    function checkPassword(pw1, pw2) {
        if (pw1 !== pw2){
            return false;
        }else {
            return true;
        }
    }

    var check = checkPassword(password,confirm_password);

    if (validateEmail(username) && check === true){
        alert("Everything matches");
        document.getElementById("signForm").submit();// Form submission

    }else {
        alert("They dont match");
    }

}