
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

        //close/hide form
        $('#closeb').on('click', function(){
            $('#hiddenform').fadeOut('fast');
            $('#page-mask').fadeOut('fast');
            $('#collection-form')[0].reset();
        });
    });




    $(document).ready(function()
    {
        $('#categories').on('click', function()
        {
            $('#page-mask').fadeIn('medium');
            $('#stick-category').fadeIn('medium');
        });
        $('#close').on('click', function()
        {
            if($(event.target).is('#close'))
            {
                $('#page-mask').fadeOut('medium');
                $('#stick-category').fadeOut('medium');
            }
        });
        $('#okaybtn').on('click', function()
        {
            if($(event.target).is('#okaybtn'))
            {
                $('#page-mask').fadeOut('medium');
                $('#stick-category').fadeOut('medium');
            }
        });
        $('#page-mask').on('click', function()
        {
            $('#page-mask').fadeOut('slow');
            $('#stick-category').fadeOut('slow');
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





