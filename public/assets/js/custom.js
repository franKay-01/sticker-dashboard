$(document).ready(function () {

    //Toggle create new collection form
    $(function () {
        var checkboxesChecked = [];


        $('#slider').on('change', function () {

            alert(document.getElementById("slider").value);

        });

        $('#_addCategoryForm').on('submit', function () {
            var checkboxes = document.getElementsByName("categoryList");
            // loop over them all
            for (var i = 0; i < checkboxes.length; i++) {
                // And stick the checked ones onto an array...
                if (checkboxes[i].checked) {
                    checkboxesChecked.push(checkboxes[i].value);
                }
            }

        });

        //show collection form
        //TODO convert id's to classes

        $('#read').on('click', function () {
            // $('#not_read').
            document.getElementById("circle").style.color = '#c3bfb7';
            var not_read = document.getElementsByClassName('not_read');
            for (var i = 0; i < not_read.length; i++) {
                not_read[i].style.display = "none";
            }

            var read = document.getElementsByClassName('read_all');
            for (var i = 0; i < read.length; i++) {
                read[i].style.display = "block";
            }
        });

        $('#unread').on('click', function () {
            document.getElementById("circle").style.color = '#0D47A1';

            var not_read = document.getElementsByClassName('not_read');
            for (var i = 0; i < not_read.length; i++) {
                not_read[i].style.display = "block";
            }

            var read = document.getElementsByClassName('read_all');
            for (var i = 0; i < read.length; i++) {
                read[i].style.display = "none";
            }
        });

        $('#show_all').on('click', function () {
            document.getElementById("circle").style.color = 'black';

            var not_read = document.getElementsByClassName('not_read');
            for (var i = 0; i < not_read.length; i++) {
                not_read[i].style.display = "block";
            }

            var read = document.getElementsByClassName('read_all');
            for (var i = 0; i < read.length; i++) {
                read[i].style.display = "block";
            }
        });

        $('.text_element').on('click', function () {
            $('#hiddenTextCatalouge').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('.sticker_element').on('click', function () {
            $('#hiddenStickerCatalouge').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('.image_element').on('click', function () {
            $('#hiddenImageCatalouge').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('.divider_element').on('click', function () {
            $('#hiddenDividerCatalouge').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('.bold_element').on('click', function () {
            $('#hiddenBoldCatalouge').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('.quote_element').on('click', function () {
            $('#hiddenQuoteCatalouge').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('.italic_element').on('click', function () {
            $('#hiddenItalicCatalouge').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('#showAdImageForm').on('click', function () {
            $('#pageMask').fadeIn('fast');
            $('#hiddenAddAdvertImageForm').fadeIn('fast');
            $('#logo').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
            $('.login_card').fadeOut('fast');
            $('#review_form').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#opaqueDiv').fadeOut('fast');
        });

        $('#showAdLinkForm').on('click', function () {
            $('#pageMask').fadeIn('fast');
            $('#hiddenAddAdvertLinks').fadeIn('fast');
            $('#logo').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
            $('.login_card').fadeOut('fast');
            $('#review_form').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#opaqueDiv').fadeOut('fast');
        });

        // This is to show a hidden form to create new packs
        $('#showCreateForm').on('click', function () {
            $('#hiddenCreateForm').fadeIn('fast');
            $('#pageMask').fadeIn('fast');
            $('#opaqueDiv').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#login_card').fadeOut('fast');
            $('#review_form').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
        });

        $('#btn_cancelAdImage').on('click', function () {
            $('#hiddenAddAdvertImageForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('.login_card').fadeIn('fast');
            $('#review_form').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
        });

        $(".change").click(function () {
            $(".storyItemId").val($(this).attr("data-id"));
            $("#hiddenChangeType").fadeIn('fast');
            $("#pageMask").fadeIn('fast');
            $("#logo").fadeOut('fast');
            $(".welcome_post").fadeOut('fast');
            $(".story").fadeOut('fast');
            $("#foot").fadeOut('fast');
        });

        $("#btn_cancelChangeType").click(function () {
            $("#hiddenChangeType").fadeOut('fast');
            $("#pageMask").fadeOut('fast');
            $("#logo").fadeIn('fast');
            $(".welcome_post").fadeIn('fast');
            $(".story").fadeIn('fast');
            $("#foot").fadeIn('fast');
            $('.common').attr("hidden", "hidden");
            $('.image').attr("hidden", "hidden");
            $('#pack_form')[0].reset();

        });

        $('#btn_cancelAdLink').on('click', function () {
            $('#hiddenAddAdvertLinks').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('.login_card').fadeIn('fast');
            $('#review_form').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
        });

        $('#btnAddAdverts').on('click', function () {
            $('#pageMask').fadeIn('fast');
            $('#hiddenAddAdvertForm').fadeIn('fast');
            $('#all_stories').fadeOut('fast');
            $('#logo').fadeOut('fast');
            $('#searchCategory').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#opaqueDiv').fadeOut('fast');
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


        $('#removePublished').on('click', function () {
            $('#pageMask').fadeIn('fast');
            $('#removePublish').fadeIn('fast');
            $('#logo').fadeOut('fast');
            $('.welcome_post').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#opaqueDiv').fadeOut('fast');
        });

        $('#cancelPublish').on('click', function () {
            $('#pageMask').fadeOut('fast');
            $('#removePublish').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('.welcome_post').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
        });

        $('#remove_story').on('click', function () {
            $('#pageMask').fadeIn('fast');
            $('.remove_story').fadeIn('fast');
            $('#logo').fadeOut('fast');
            $('.welcome_post').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#opaqueDiv').fadeOut('fast');
        });

        $('#cancel_delete').on('click', function () {
            $('#pageMask').fadeOut('fast');
            $('.remove_story').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('.welcome_post').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
        });

        $('#showPermission').on('click', function () {
            $('#pageMask').fadeIn('fast');
            $('#askPermission').fadeIn('fast');
            $('#logo').fadeOut('fast');
            $('.welcome_post').fadeOut('fast');
            $('#Welcome').fadeOut('fast');
            $('#signoutLink').fadeOut('fast');
            $('#opaqueDiv').fadeOut('fast');
        });

        $('#cancelPermission').on('click', function () {
            $('#pageMask').fadeOut('fast');
            $('#askPermission').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('.welcome_post').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
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

        $('#btnCategoryAdd').on('click', function () {
            $('#addCategoryForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#detailsForm').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
        });

        $('#btnCategoryCancel').on('click', function () {
            $('#addCategoryForm').fadeOut('fast');
            $('#deleteForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#pack_id').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#detailsForm').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            // $('#_addCategoryForm').fadeOut('fast');
        });

        $('#btnCloseCatalogue').on('click', function () {
            $('#hiddenTextCatalouge').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('#btnCloseStickerCatalouge').on('click', function () {
            $('#hiddenStickerCatalouge').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('#btnCloseDividerCatalouge').on('click', function () {
            $('#hiddenDividerCatalouge').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('#btnCloseImgCatalouge').on('click', function () {
            $('#hiddenImageCatalouge').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('#btnCloseQuoteCatalouge').on('click', function () {
            $('#hiddenQuoteCatalouge').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('#btnCloseItalicCatalouge').on('click', function () {
            $('#hiddenItalicCatalouge').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('#btnCloseBoldCatalouge').on('click', function () {
            $('#hiddenBoldCatalouge').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#pack_id').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('#btnCloseStory').on('click', function () {
            $('#hiddenAddStoryForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#all_stories').fadeIn('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_form')[0].reset();
        });

        $('.btnCloseAd').on('click', function () {
            $('#hiddenAddAdvertForm').fadeOut('fast');
            $('#pageMask').fadeOut('fast');
            $('#all_stories').fadeIn('fast');
            $('#logo').fadeIn('fast');
            $('#Welcome').fadeIn('fast');
            $('#signoutLink').fadeIn('fast');
            $('#opaqueDiv').fadeIn('fast');
            $('#pack_form')[0].reset();
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

    // $checks = $(":checkbox");
    // var categories = String($('#category').val()).split(",");
    // for (var i = 0; i < categories.length; i++) {
    //     $('input:checkbox[data-name="' + categories[i] + '"]').prop('checked', true);
    // }
    //
    // $checks.on('change', function (e) {
    //     var string = $checks.filter(":checked").map(function (i, v) {
    //         return $(this).attr("data-name");
    //     }).get().join(", ");
    //
    //     var ids = $checks.filter(":checked").map(function (i, v) {
    //         return $(this).val();
    //     }).get().join(",");
    //
    //     console.log("selected categories " + string);
    //     //  alert("E is "+string);
    //     $('#categoryInput').val(string);
    //     $('#cat').val(ids);
    // });

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

    $('#btnAddStory').on('click', function () {
        $('#pageMask').fadeIn('fast');
        $('#hiddenAddStoryForm').fadeIn('fast');
        $('#all_stories').fadeOut('fast');
        $('#logo').fadeOut('fast');
        $('#searchCategory').fadeOut('fast');
        $('#Welcome').fadeOut('fast');
        $('#signoutLink').fadeOut('fast');
        $('#opaqueDiv').fadeOut('fast');
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

    //show deleteForm
    $('.delbtn').on('click', function () {
        // var $this = $(this);
        $('#deleteForm').fadeIn('fast');
        $('#pageMask').fadeIn('fast');
        $('#logo').fadeOut('fast');
        $('.welcome_post').fadeOut('fast');
        $('#signoutLink').fadeOut('fast');
        $('#opaqueDiv').fadeOut('fast');
        $('#detailsForm').fadeOut('fast');

    });

    //close deleteForm
    $('.closeDelete').on('click', function () {
        $('#deleteForm').fadeOut('fast');
        $('#pageMask').fadeOut('fast');
        $('#logo').fadeIn('fast');
        $('#pack_id').fadeIn('fast');
        $('.welcome_post').fadeIn('fast');
        $('#signoutLink').fadeIn('fast');
        $('#opaqueDiv').fadeIn('fast');
        $('#detailsForm').fadeIn('fast');
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







