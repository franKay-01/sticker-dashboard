function signUp() {
    var name = document.getElementById('name_field').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var confirm_password = document.getElementById('confirm_password').value;
    var terms = document.getElementById('terms_policy').checked;

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
    // if (terms === true){
    //     alert("Check box ticked");
    //     document.getElementById("nameField").innerHTML = "Name is required";
    // }else {
    //     alert("Check box nt ticked");
    // }
    if (validateEmail(username) && check === true && name !== null && terms === true){
        alert("Everything matches");
        // document.getElementById("signForm").submit();// Form submission

    }else {
        if (validateEmail(username) === false){
            document.getElementById("user").innerHTML = "Email Format is not correct";
        }
        if (username === ""){
            document.getElementById("user").innerHTML = "Email Required";
        }
        if (check !== true){
            document.getElementById("confirm").innerHTML = "Passwords Do Not Match";
        }

        if (password === ""){
            document.getElementById("pwd").innerHTML = "Password is Required";
        }else {
            document.getElementById("pwd").innerHTML = "Password is Required";
        }
        if (name === ""){
            document.getElementById("nameField").innerHTML = "Name is Required";
        }

        if (terms !== true){
            document.getElementById("policy").innerHTML = "Please tick";
        }
        alert("They dont match");

    }

}


function dropbox() {
    options = {

        success: function (files) {
            files.forEach(function (file) {
                add_img_to_list(file);
            });
        },
        cancel: function () {
            //optional
        },
        linkType: "direct", // "preview" or "direct"
        multiselect: false, // true or false
        extensions: ['.png', '.jpg'],
    };
    Dropbox.choose(options);
}

function add_img_to_list(file) {
    var name = file.name;
    var source = file.link;
    var type = name.substr(name.length - 3);

    document.getElementById('fileUrl').value = source;
    document.getElementById('fileName').value = name;
    document.getElementById('fileType').value = type;
}