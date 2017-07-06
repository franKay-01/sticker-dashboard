/**
 * Created by derry on 28-Jun-17.
 */
var drop = $("input");
drop.on('dragenter', function (e) {
    $(".drop").css({
        "border": "4px dashed grey",
        "background": "#8E99A5"
    });
    $(".cont").css({
        "color": "#09f"
    });
}).on('dragleave dragend mouseout drop', function (e) {
    $(".drop").css({
        "border": "3px dashed #DADFE3",
        "background": "transparent"
    });
    $(".cont").css({
        "color": "#8E99A5"
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
                // Render thumbnail.
                var span = document.createElement('span');
                span.innerHTML = ['<img class="thumb" name="im1" " src="', e.target.result,
                    '" title="', escape(theFile.name), '"/>'].join('');
                document.getElementById('list').insertBefore(span, null);
                console.log("success in upload");
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
        console.log("F:::" +f.toString() );
    }
}

$('#files').change(handleFileSelect);