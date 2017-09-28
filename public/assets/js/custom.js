$(document).ready(function () {

    //Toggle create new collection form
    $(function () {
        //show collection form
        $('#showCreateForm').on('click', function () {
            $('#hiddenCreateForm').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
        });

        //close/hide form
        $('#closeSign').on('click', function () {
            $('#hiddenCreateForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#collectionForm')[0].reset();
        });
        $('#btnCancelCreateColl').on('click', function () {
            $('#hiddenCreateForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#collectionForm')[0].reset();
        });
    });

    /*Toggle  'Choose categories' menu*/
    $('#btnChooseCategory').click(function () {
        if ($('.categoriesList').is(':visible')) {
            $('.categoriesList').slideUp('medium');
        }
        else {
            $('.categoriesList').slideDown('medium');
        }
    });

    $checks = $(":checkbox");
    var categories = String($('#category').val()).split(",");
    for( var i = 0; i < categories.length; i++ ) {
        console.log(i);
        $('input:checkbox[data-name="' + categories[i] + '"]').prop('checked', true);
    }
    $checks.on('change', function (e) {
        var string = $checks.filter(":checked").map(function (i, v) {
            return $(this).attr("data-name");
        }).get().join(", ");
        $('#categoryInput').val(string);

    });

    //add button style
    $('#btnAddCategory').on('mouseover', function () {
        $('.plus').attr('src', 'pluscolor.png');
    });
    $('#btnAddCategory').on('mouseout', function () {
        $('.plus').attr('src', 'pluswhite.png');
    });

    //show/hide edit form button
    $('.editbtn1').each(function () {

        $('.editbtn1').on('click', function () {
            var $this = $(this);
            $('#pageMask').fadeIn('fast');
            $('.hiddenEditForm').fadeIn('fast');

            //insert category name into text field for editing
            $('#categoryId').val($this.val());
            $('#categoryId').val($this.val());
        });
    });
    //remove form
    $('#btnCancelEditCat').on('click', function () {
        $('#pageMask').fadeOut('fast');
        $('.hiddenEditForm').fadeOut('fast');
    });

    //show add-category form
    $('#btnAddCategory').on('click', function () {
        $('#pageMask').fadeIn('fast');
        $('.hiddenAddCatForm').fadeIn('fast');
    });
    //remove form
    $('#btnCancelAddCat').on('click', function () {
        $('#pageMask').fadeOut('fast');
        $('.hiddenAddCatForm').fadeOut('fast');
        $('#editCategoryForm')[0].reset();
    });


    //show 'remove-category' form
    $('.delbtn1').each(function () {

        $('.delbtn1').on('click', function () {
            var $this = $(this);
            $('.hiddenRemoveCategory').fadeIn('fast');
            $('#pageMask').fadeIn('fast');

            //insert category name into text field for removal
            $('#catNameRemove').val($this.val());
            $('#inputRemoveId').val($this.attr("data-id"));
        });
    });
    //cancel remove
    $('#btnCancelRemove').on('click', function () {
        $('#pageMask').fadeOut('fast');
        $('.hiddenRemoveCategory').fadeOut('fast');
        $('#deleteCategoryForm')[0].reset();
    });


    //console.log("current cookie: " + document.cookie);


});





