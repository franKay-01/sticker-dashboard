$(document).ready(function () {

    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows: false
        }
    );

    var existingCategories = $('#category').val();

    //Toggle create new collection form
    $(function () {
        //show collection form
        $('#showform').on('click', function () {
            $('#hiddenform').fadeIn('fast');
            $('#page-mask1').fadeIn('fast');
        });

        //close/hide form
        $('#closeb').on('click', function () {
            $('#hiddenform').fadeOut('fast');
            $('#page-mask1').fadeOut('fast');
            $('#collection-form')[0].reset();
        });
        $('#cancell').on('click', function () {
            $('#hiddenform').fadeOut('fast');
            $('#page-mask1').fadeOut('fast');
            $('#collection-form')[0].reset();
        });
    });

    /*Toggle  'Choose categories' menu*/
    $('#chooseCat').click(function () {
        if ($('.categories').is(':visible')) {
            $('.categories').slideUp('medium');
        }
        else {
            $('.categories').slideDown('medium');
        }
    });

    $checks = $(":checkbox");
    $('input:checkbox[data-name="' + 'funny' + '"]').prop('checked', true);
    $checks.on('change', function (e) {
        var string = $checks.filter(":checked").map(function (i, v) {
            return $(this).attr("data-name");
        }).get().join(", ");
        $('#category').val(string);

    });

    //add button style
    $('#addbtn').on('mouseover', function () {
        $('.plus').attr('src', 'pluscolor.png');
    });
    $('#addbtn').on('mouseout', function () {
        $('.plus').attr('src', 'pluswhite.png');
    });

    //show/hide edit form button
    $('.editbtn1').each(function () {

        $('.editbtn1').on('click', function () {
            var $this = $(this);
            $('#page-mask1').fadeIn('fast');
            $('.hidden').fadeIn('fast');

            //insert category name into text field for editing
            $('#catname').val($this.val());
            $('#currentName').val($this.val());
        });
    });
    //remove form
    $('#cancelbtn').on('click', function () {
        $('#page-mask1').fadeOut('fast');
        $('.hidden').fadeOut('fast');
    });

    //show add-category form
    $('#addbtn').on('click', function () {
        $('#page-mask1').fadeIn('fast');
        $('.hidden1').fadeIn('fast');
    });
    //remove form
    $('#cancelbtn1').on('click', function () {
        $('#page-mask1').fadeOut('fast');
        $('.hidden1').fadeOut('fast');
        $('#editform')[0].reset();
    });


    //show 'remove-category' form
    $('.delbtn1').each(function () {

        $('.delbtn1').on('click', function () {
            var $this = $(this);
            $('.hidden2').fadeIn('fast');
            $('#page-mask1').fadeIn('fast');

            //insert category name into text field for removal
            $('#catnameD').val($this.val());
            $('#currentNameD').val($this.val());
        });
    });
    //cancel remove
    $('#cancelbtn2').on('click', function () {
        $('#page-mask1').fadeOut('fast');
        $('.hidden2').fadeOut('fast');
        $('#deleteform')[0].reset();
    });


    console.log("current cookie: " + document.cookie);


});





