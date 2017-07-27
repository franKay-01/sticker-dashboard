/**
 * Created by derry on 28-Jun-17.
 */
var drop = $("input");
drop.on('dragenter mouseover', function (e) {
    $(".drop").css({
        "border": "4px dashed white",
        "background": "#9598d0"
    });
    $(".cont").css({
        "color": "#737373"
    });
}).on('dragleave dragend mouseout drop', function (e) {
    $(".drop").css({
        "border": "3px dashed #DADFE3",
        "background": "white"
    });
    $(".cont").css({
        "color": "#999999"
    });
});



function handleFileSelect(evt) {

    var files = evt.target.files; // FileList object
    var arrayfiles = [];
    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        arrayfiles.push(f);
        console.log("Array length = " + arrayfiles.length);

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {

                //preview images in drag n drop area
                var span = document.createElement('span');
                span.innerHTML = ['<img class="thumb" name="im1" " src="', e.target.result,
                    '" title="', escape(theFile.name), '"/>'].join('');

                document.getElementById('list').insertBefore(span, null);
                console.log("success in upload");
                //create preview for image in category option

                var prev = document.getElementById('img-prev');
                prev.innerHTML = ['<img id="img-p" name="im1" " src="', e.target.result,
                    '" title="', escape(theFile.name), '"/>'].join('');
                document.getElementById('fname').innerHTML = theFile.name;

                //input element to hold categories of each sticker
            };
        })(f);


        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
        console.log("F:::" +f.toString() );
    }
}

$('#files').change(handleFileSelect);

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

//clear form
$('#clear').click(function(){
    $('#upform')[0].reset();
    $('.thumb').remove();
});


