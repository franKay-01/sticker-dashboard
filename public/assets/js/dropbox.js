$(document).ready(function () {

    //dropbox choose options
    options = {
        success: function (file) {
            // files.forEach(function(file) {
            //     dropboxImageSelected(file);
            // });
            //  dropboxImageSelected(file);
            console.log("image source " + JSON.stringify(file));
            imageToBase64(file.link, function (result) {

                fileUploadUI(file.name, result)
            })
        },
        cancel: function () {
            //optional
        },
        linkType: "direct", // "preview" or "direct"
        multiselect: false, // true or false
        //  extensions: ['.png', '.jpg'] //restrict to curtain extensions
        extensions: ['images'] //restrict to curtain extensions
    };

    //show dropbox button in view
    //TODO learn how to customize
    var button = Dropbox.createChooseButton(options);
    $("#dropbox-container").append(button);

    function dropboxImageSelected(file, callback) {

        var reader = new FileReader();

        reader.onloadend = function () {
            callback();
        };
        reader.readAsDataURL(file);

    }

    var fileUploadUI = function (name, result) {
        var span = $('<span></span>');
        span.html(['<img class="thumb" name="im1" " src="', result,
            '" title="', escape(name), '"/>'].join(''));
        console.log(span.html());
        $('#filesList').before(span);
    };

    var imageToBase64 = function (url, callback) {
        var img = new Image();
        img.src = url;
        img.crossOrigin = 'Anonymous';

        img.onload = function () {
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            var dataURL;
            canvas.height = this.height;
            canvas.width = this.width;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.databaseURI();
            console.log("image to base 64 " + dataURL);
            callback(dataURL);
            canvas = null;
        };



    }

});