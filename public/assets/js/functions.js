function checkForm(form) {
    if (form.name.value === "") {
        document.getElementById("nameField").innerHTML = "Username cannot be blank";
        form.name.focus();
        return false;
    }

    var truth = validateEmail(form.username.value);

    if (truth !== true) {
        document.getElementById("user").innerHTML = "Email Format is not correct";
        form.username.focus();
        return false;
    } else {
        document.getElementById("user").innerHTML = "";

    }

    if (document.getElementById('terms_policy').checked !== true) {
        document.getElementById("policy").innerHTML = "Please Read the policy and tick ✔";
        return false;
    } else {
        document.getElementById("policy").innerHTML = "";

    }

    if (form.password.value === form.confirm_password.value) {
        document.getElementById("confirm").innerHTML = "";
    }

    if (form.password.value !== "" && form.password.value === form.confirm_password.value) {
        if (form.password.value.length < 8) {
            document.getElementById("pwd").innerHTML = "Password must contain at least eight (8) characters";
            form.password.focus();
            return false;
        } else {
            document.getElementById("pwd").innerHTML = "";
        }

        if (form.password.value === form.username.value) {
            document.getElementById("pwd").innerHTML = "Password must be different from Email";
            form.password.focus();
            return false;
        } else {
            document.getElementById("pwd").innerHTML = "";
        }

        re = /[0-9]/;
        if (!re.test(form.password.value)) {
            document.getElementById("pwd").innerHTML = "Password must contain at least one number (0-9)";
            form.password.focus();
            return false;
        } else {
            document.getElementById("pwd").innerHTML = "";
        }

        re = /[a-z]/;
        if (!re.test(form.password.value)) {
            document.getElementById("pwd").innerHTML = "Password must contain at least one lowercase letter (a-z)!";
            form.password.focus();
            return false;
        } else {
            document.getElementById("pwd").innerHTML = "";
        }

        re = /[A-Z]/;
        if (!re.test(form.password.value)) {
            document.getElementById("pwd").innerHTML = "Password must contain at least one uppercase letter (A-Z)!";
            form.password.focus();
            return false;
        } else {
            document.getElementById("pwd").innerHTML = "";
        }

    } else if (form.password.value !== form.confirm_password.value) {
        document.getElementById("confirm").innerHTML = "Please check that you've entered and confirmed your password!";
        form.confirm_password.focus();
        return false;
    }

    return true;
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function checkSignUpEmail() {
    var password = document.getElementById("forgotten_password").value;
    var result = validateEmail(password);
    alert(result);
    if (result !== true){
        document.getElementById("password").innerHTML = "Please check that you've entered and confirmed your email!";
        return false;
    }else {
        document.getElementById("forgotten_form").submit();// Form submission
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