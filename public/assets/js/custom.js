$(document).ready(function () {

    //Toggle create new collection form
    $(function () {

        $('#_addCategoryForm').on('submit', function () {
            var checkboxes = document.getElementById("categoryList");
            var checkboxesChecked = [];
            // loop over them all
            for (var i=0; i<checkboxes.length; i++) {
                // And stick the checked ones onto an array...
                if (checkboxes[i].checked) {
                    checkboxesChecked.push(checkboxes[i]);
                }
            }
            alert(checkboxesChecked.length);
            return false;
        });
        //show collection form
        //TODO convert id's to classes
        // This is to show a hidden form to create new packs
        $('#showCreateForm').on('click', function () {
            $('#hiddenCreateForm').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('#addCategory').on('click', function () {
            $('#addCategoryForm').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
            $('#detailsForm').fadeOut('fast');
        });

        //clear form
        $('#clearBtn').on('click', function () {
            $("#image_id").remove();
        });

        //close/hide form
        $('#closeSign').on('click', function () {
            $('#hiddenCreateForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('#btnCategoryCancel').on('click', function () {
            $('#addCategoryForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#detailsForm').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
        });

        //This is to reset a form and close it
        $('#btnCancel').on('click', function () {
            $('#hiddenCreateForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_form')[0].reset();
        });
    });

    /*Toggle  'Choose categories' menu*/
    $('#btnChooseCategory').click(function () {
        const categoriesList = $('.categoriesList');
        if (categoriesList.is(':visible')) {
            categoriesList.slideUp('medium');
        }
        else {
            categoriesList.slideDown('medium');
        }
    });

    $checks = $(":checkbox");
    var categories = String($('#category').val()).split(",");
    for (var i = 0; i < categories.length; i++) {
        console.log(i);
        $('input:checkbox[data-name="' + categories[i] + '"]').prop('checked', true);
    }
    $checks.on('change', function (e) {
        var string = $checks.filter(":checked").map(function (i, v) {
            return $(this).attr("data-name");
        }).get().join(", ");
        $('#categoryInput').val(string);

    });

    //show/hide edit form button
    // $('#editbtn1').each(function () {

    //TODO example names categoryEditBtn btnEditCategories
    //TODO add comments or use description names
    // This is to show a form that allows a user edit the selected category
    $('.editbtn1').on('click', function () {
        var $this = $(this);
        $('#pageMask').fadeIn('fast');
        $('#hiddenEditForm').fadeIn('fast');
        $('#opaqueDiv').fadeOut('fast');
        $('#searchBar').fadeOut('fast');
        $('#logo').fadeOut('fast');
        $('#Welcome').fadeOut('fast');
        $('#signoutLink').fadeOut('fast');

        //insert category name into text field for editing
        $('#categoryName').val($this.val());
        $('#categoryId').val($this.attr("data-id"));
    });
    // });
    // This is to close the form being used to edit the category item
    $('#btnCancelEditCat').on('click', function () {
        $('#pageMask').fadeOut('fast');
        $('#hiddenEditForm').fadeOut('fast');
        $('#opaqueDiv').fadeIn('fast');
        $('#logo').fadeIn('fast');
        $('#searchBar').fadeIn('fast');
        $('#Welcome').fadeIn('fast');
        $('#signoutLink').fadeIn('fast');
    });

    const btnAddCategory = $('#btnAddCategory');
    //add button style
    btnAddCategory.on('mouseover', function () {
        $('.plus').attr('src', 'pluscolor.png');
    });
    btnAddCategory.on('mouseout', function () {
        $('.plus').attr('src', 'pluswhite.png');
    });

    //show add-category form
    btnAddCategory.on('click', function () {
        $('#pageMask').fadeIn('fast');
        $('#hiddenAddCatForm').fadeIn('fast');
        $('#logo').fadeOut('fast');
        $('#searchCategory').fadeOut('fast');
        $('#Welcome').fadeOut('fast');
        $('#signoutLink').fadeOut('fast');
        $('#opaqueDiv').fadeOut('fast');
    });
    //remove form
    $('#btn_cancelAddCat').on('click', function () {
        $('#pageMask').fadeOut('fast');
        $('#hiddenAddCatForm').fadeOut('fast');
        $('#logo').fadeIn('fast');
        $('#Welcome').fadeIn('fast');
        $('#searchCategory').fadeIn('fast');
        $('#signoutLink').fadeIn('fast');
        $('#opaqueDiv').fadeIn('fast');
        $('#pack_form')[0].reset();
    });

    //show 'remove-category' form
    $('.delbtn1').on('click', function () {
        var $this = $(this);
        $('#hiddenRemoveCategory').fadeIn('fast');
        $('#pageMask').fadeIn('fast');
        $('#logo').fadeOut('fast');
        $('#searchCategory').fadeOut('fast');
        $('#Welcome').fadeOut('fast');
        $('#signoutLink').fadeOut('fast');
        $('#opaqueDiv').fadeOut('fast');
        ;
        //insert category name into text field for removal
        $('#catNameRemove').val($this.val());
        $('#inputRemoveId').val($this.attr("data-id"));
    });

    //cancel remove
    $('#btnCancelRemove').on('click', function () {
        $('#pageMask').fadeOut('fast');
        $('#hiddenRemoveCategory').fadeOut('fast');
        $('#logo').fadeIn('fast');
        $('#Welcome').fadeIn('fast');
        $('#searchCategory').fadeIn('fast');
        $('#signoutLink').fadeIn('fast');
        $('#opaqueDiv').fadeIn('fast');
        $('#pack_form')[0].reset();
    });



});







