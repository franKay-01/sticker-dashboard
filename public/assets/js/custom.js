// //import parse dependencies
// var Parse = require("parse");
// var ParseServer = require('parse-server').ParseServer;
Parse.initialize("cryptic-waters12");
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';

//input variables
var stName = $("#stname").val();
var lName = $("#lname").val();
var category = $("#category").val();

$(document).ready(function () {

    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows: false
        }
    );



    // $("#filein").click(function (input) {
    //     alert("Clicked");
    //     // if (input.files && input.files[0]) {
    //     //     var reader = new FileReader();
    //     //     console.log("File uploaded");
    //     //     reader.onload = function (e) {
    //     //         $('#left-col').attr('src', e.target.result);
    //     //     };
    //     //     reader.readAsDataURL(input.files[0]);
    //     // }
    // });

    $("#filein").onchange(function (input) {
        alert("Changed");
    });
    //
    // var newFile = $("#filein")[0];
    // if(newFile.files.length > 0)
    // {
    //     var file = newFile.files[0];
    //     var filename = file.name;
        // var trimName = filename.substring(0, filename.length-4);
        // $("#filein").change(function () {
        //     if (this.files && this.files[0]) {
        //         var reader = new FileReader();
        //
        //         reader.onload = function (e) {
        //             var img = $('#add-img').attr('src', e.target.result);
        //             console.log("file: " + filename);
        //         };
        //
        //         reader.readAsDataURL(this.files[0]);
        //     }
        // });

        // $("#left-col").attr("src", file);

    //AJAX
    // $("#tform").submit(function()
    // {
    //     var formData = new FormData($(this)[0]);
    //     console.log(formData);
    //     // $.ajax({
    //     //     url: "/login",
    //     //     type: "POST",
    //     //     data: formData,
    //     //     async: false,
    //     //     cache: false,
    //     //     contentType: false,
    //     //     processData: false
    //     // });
    //     // return false;
    // });
// }
// else
//     {
//         function error(err) {
//             console.log("file not uploaded" + err);
//         }
//     }

    console.log("current cookie: " + document.cookie);

});





