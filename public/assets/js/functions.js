
    function checkForm(form)
    {
        if(form.name.value === "") {
            document.getElementById("nameField").innerHTML = "Username cannot be blank";
            form.name.focus();
            return false;
        }

        function validateEmail(email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        var truth = validateEmail(form.username.value);

        if (truth !== true){
            document.getElementById("user").innerHTML = "Email Format is not correct";
            form.username.focus();
            return false;
        }else {
            document.getElementById("user").innerHTML = "";

        }

        if (document.getElementById('terms_policy').checked !== true){
            document.getElementById("policy").innerHTML = "Please Read the policy and tick ✔";
            return false;
        }else {
            document.getElementById("policy").innerHTML = "";

        }

        if(form.password.value !== "" && form.password.value === form.confirm_password.value) {
            if(form.password.value.length < 8) {
                document.getElementById("pwd").innerHTML = "Password must contain at least eight (8) characters";
                form.password.focus();
                return false;
            }else {
                document.getElementById("pwd").innerHTML = "";
            }

            if(form.password.value === form.username.value) {
                document.getElementById("pwd").innerHTML = "Password must be different from Email";
                form.password.focus();
                return false;
            }
            re = /[0-9]/;
            if(!re.test(form.password.value)) {
                document.getElementById("pwd").innerHTML = "Password must contain at least one number (0-9)";
                form.password.focus();
                return false;
            }
            re = /[a-z]/;
            if(!re.test(form.password.value)) {
                document.getElementById("pwd").innerHTML = "Password must contain at least one lowercase letter (a-z)!";
                form.password.focus();
                return false;
            }
            re = /[A-Z]/;
            if(!re.test(form.password.value)) {
                document.getElementById("pwd").innerHTML = "Password must contain at least one uppercase letter (A-Z)!";
                form.password.focus();
                return false;
            }
        } else {
            document.getElementById("confirm").innerHTML = "Please check that you've entered and confirmed your password!";
            form.confirm_password.focus();
            return false;
        }

        if (form.password.value === form.confirm_password.value){
            document.getElementById("confirm").innerHTML = "";
        }

        return true;
    }


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
        }else if (pw1 === ""){
            return false;
        }else if (pw2 === ""){
            return false;
        }else if (pw1 === pw2) {
            return true;
        }
    }

    var check = checkPassword(password,confirm_password);

    if (validateEmail(username) && check === true && name !== "" && terms === true){
        document.getElementById("signForm").submit();// Form submission
    }else {
        if (validateEmail(username) === false){
            document.getElementById("user").innerHTML = "Email Format is not correct";
        }else {
            document.getElementById("user").innerHTML = "";
        }

        if (username === ""){
            document.getElementById("user").innerHTML = "Email Required";
        }else {
            document.getElementById("user").innerHTML = "";
        }

        if (check !== true){
            document.getElementById("confirm").innerHTML = "Passwords Do Not Match";
        }else {
            document.getElementById("confirm").innerHTML = "";
        }

        if (password === ""){
            document.getElementById("pwd").innerHTML = "Password is Required";
        }else {
            document.getElementById("pwd").innerHTML = "";
        }

        if (name === ""){
            document.getElementById("nameField").innerHTML = "Name is Required";
        }else {
            document.getElementById("nameField").innerHTML = "";
        }

        if (terms !== true){
            document.getElementById("policy").innerHTML = "Please Read the policy and tick ✔";
        }else {
            document.getElementById("policy").innerHTML = "";
        }
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