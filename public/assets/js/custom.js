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

    // });

    $("#filein").change(function (input) {
        console.log($("#filein").val());
    });
    //


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





