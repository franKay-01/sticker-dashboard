
$(document).ready(function () {

    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows: false
        }
    );

    //UPLOAD FILE AND PREVIEW
    // function readURL(input) {
    //     if (input.files && input.files[0]) {
    //         var reader = new FileReader();
    //
    //         reader.onload = function (e) {
    //             $('#add-img').attr('src', e.target.result);
    //         }
    //         reader.readAsDataURL(input.files[0]);
    //     }
    // }
    // $("#filein").change(function(){
    //     readURL(this);
    // });
    //UPLOAD FILE AND PREVIEW

    console.log("current cookie: " + document.cookie);



});





