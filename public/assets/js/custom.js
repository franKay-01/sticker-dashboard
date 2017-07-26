
$(document).ready(function () {

    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows: false
        }
    );

    //Toggle create new collection form
    $(function()
    {
        $('#showform').on('click', function(){
            $('#hiddenform').fadeIn('fast');
            $('#page-mask').fadeIn('fast');
        });

        $('#closeb').on('click', function(){
            $('#hiddenform').fadeOut('fast');
            $('#page-mask').fadeOut('fast');
        });
    });


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





