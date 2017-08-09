
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
            $('#page-mask1').fadeIn('fast');
        });

        //close/hide form
        $('#closeb').on('click', function(){
            $('#hiddenform').fadeOut('fast');
            $('#page-mask1').fadeOut('fast');
            $('#collection-form')[0].reset();
        });
        $('#cancell').on('click', function(){
            $('#hiddenform').fadeOut('fast');
            $('#page-mask1').fadeOut('fast');
            $('#collection-form')[0].reset();
        });
    });

/*Toggle  'select categories' menu*/
    $('#chooseCat').click(function(){
        if ($('.categories').is(':visible')) {
            $('.categories').slideUp('medium');
        }
        else {
            $('.categories').slideDown('medium');
        }
    });

    $checks = $(":checkbox");
    $checks.on('change', function() {
        var string = $checks.filter(":checked").map(function(i,v){
            return this.value;
        }).get().join(", ");
        $('#category').val(string);
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

    //TAG COMPONENTS
// function to insert tags after maininput element
    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
    [].forEach.call(document.getElementsByClassName('tags-input'), function (el) {
        var hiddenInput = document.createElement('input'),
            mainInput = document.createElement('input'),
            tags = [];

        hiddenInput.setAttribute('type', 'hidden');
        hiddenInput.setAttribute('name', el.getAttribute('data-name'));

        mainInput.setAttribute('type', 'text');
        mainInput.setAttribute('placeholder', 'Type a category and press comma(,)');
        mainInput.classList.add('main-input');
        mainInput.addEventListener('input', function () {
            var enteredTags = mainInput.value.split(',');
            if (enteredTags.length > 1) {
                enteredTags.forEach(function (t) {
                    var filteredTag = filterTag(t);
                    if (filteredTag.length > 0)
                        addTag(filteredTag);
                });
                mainInput.value = '';
            }
        });

        mainInput.addEventListener('keydown', function (e) {
            var keyCode = e.which || e.keyCode;
            if (keyCode === 8 && mainInput.value.length === 0 && tags.length > 0) {
                removeTag(tags.length - 1);
            }
        });

        el.appendChild(mainInput);
        el.appendChild(hiddenInput);

        addTag('funny');

        function addTag (text) {
            var tag = {
                text: text,
                element: document.createElement('span')
            };

            tag.element.classList.add('tag');
            //set name of tags/category
            tag.element.setAttribute('name', 'category');
            tag.element.textContent = tag.text;

            var closeBtn = document.createElement('span');
            closeBtn.classList.add('close');
            closeBtn.addEventListener('click', function () {
                removeTag(tags.indexOf(tag));
            });
            tag.element.appendChild(closeBtn);

            tags.push(tag);

            // el.insertBefore(tag.element, mainInput);
            insertAfter(mainInput, tag.element);

            refreshTags();
            console.log(tags.length);
        }

        function removeTag (index) {
            var tag = tags[index];
            tags.splice(index, 1);
            el.removeChild(tag.element);
            refreshTags();
        }

        function refreshTags () {
            var tagsList = [];
            tags.forEach(function (t) {
                tagsList.push(t.text);
            });
            hiddenInput.value = tagsList.join(',');
        }

        function filterTag (tag) {
            return tag.replace(/[^\w -]/g, '').trim().replace(/\W+/g, '-');
        }

    });

    //add button style
    $('#addbtn').on('mouseover', function(){
        $('#plus').attr('src', 'plus.png');
    });
    $('#addbtn').on('mouseout', function(){
        $('#plus').attr('src', 'plus2.png');
    });

    //show/hide edit form button
    $('.editbtn1').on('click', function () {
        $('#page-mask1').fadeIn('fast');
        $('.hidden').fadeIn('fast');
    });
    $('#cancelbtn').on('click', function () {
        $('#page-mask1').fadeOut('fast');
        $('.hidden').fadeOut('fast');
    });

    //show add-category form
    $('#addbtn').on('click', function () {
        $('#page-mask1').fadeIn('fast');
        $('.hidden1').fadeIn('fast');
    });
    $('#cancelbtn1').on('click', function () {
        $('#page-mask1').fadeOut('fast');
        $('.hidden1').fadeOut('fast');
    });






    console.log("current cookie: " + document.cookie);



});





