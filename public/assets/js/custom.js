
$(document).ready(function () {

    $('.features').slick(
        {
            dots: true,
            autoplay: true,
            arrows: false
        }
    );

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

    var drop = $("input");
    drop.on('dragenter', function (e) {
        $(".drop").css({
            "border": "4px dashed #09f",
            "background": "rgba(0, 153, 255, .05)"
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

        // Loop through the FileList and render image files as thumbnails.
        for (var i = 0, f; f = files[i]; i++) {

            // Only process image files.
            if (!f.type.match('image.*')) {
                continue;
            }

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function(theFile) {
                return function(e) {
                    // Render thumbnail.
                    var span = document.createElement('span');
                    span.innerHTML = ['<img class="thumb" src="', e.target.result,
                        '" title="', escape(theFile.name), '"/>'].join('');
                    document.getElementById('list').insertBefore(span, null);
                    console.log("success in upload");
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsDataURL(f);
            console.log("F:::" +f );
        }
    }

    $('#files').change(handleFileSelect);

});





