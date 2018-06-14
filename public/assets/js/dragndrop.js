/**
 * Created by derry on 28-Jun-17.
 */
var drop = $("input");
drop.on('dragenter mouseover', function (e) {
    $(".drop").css({
        "border": "hidden",
        "border-width":"5px",
        "background": "#a46580"
    });
    $(".cont").css({
        "color": "#ffffff"
    });
}).on('dragleave dragend mouseout drop', function (e) {
    $(".drop").css({
        "border": "hidden",
        "border-width":"5px",
        "background": "white"
    });
    $(".cont").css({
        "color": "#a46580"
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
 
                //preview newsletter in drag n drop area
                // let counter = Math.floor(Math.random() * Math.floor(1000));
                let span = document.createElement('span');
                // span.innerHTML = ['<img class="thumb" name="im1" " id="image_id',counter,'" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join('');
                span.innerHTML = ['<img class="thumb" name="im1" " id="image_id" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join('');

                document.getElementById('filesList').insertBefore(span, null);

                console.log("success in upload");

                //create preview for image in category option

                // var prev = document.getElementById('img-prev');
                // prev.innerHTML = ['<img id="img-p" name="im1" " src="', e.target.result,
                //     '" title="', escape(theFile.name), '"/>'].join('');
                // document.getElementById('fname').innerHTML = theFile.name;

                // console.log("Prev innerHTML "+prev.innerHTML);
                //input element to hold categories of each sticker
            };
        })(f);


        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
        console.log("F:::" +f.toString() );
    }
}

$('#files').change(handleFileSelect);

//clearForm form
$('#btnClearAddForm').click(function(){
    $('#addStickersForm')[0].reset();
    $('.thumb').remove();
});


