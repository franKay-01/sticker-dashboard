/**
 * Created by derry on 16-Jun-17.
 */

//NEW SCRIPT FOR DRAGNDROP
(function(window) {
    function triggerCallback(e, callback) {
        if(!callback || typeof callback !== 'function') {
            return;
        }
        var files;
        if(e.dataTransfer) {
            files = e.dataTransfer.files;
        } else if(e.target) {
            files = e.target.files;
        }
        callback.call(null, files);
    }
    function makeDroppable(ele, callback) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.setAttribute('multiple', true);
        input.setAttribute('name', 'im1');
        input.style.display = 'none';
        input.addEventListener('change', function(e) {
            triggerCallback(e, callback);
        });
        ele.appendChild(input);

        ele.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            ele.classList.add('dragover');
        });

        // ele.addEventListener('dragleave', function(e) {
        //     e.preventDefault();
        //     e.stopPropagation();
        //     ele.classList.remove('dragover');
        // });

        ele.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // ele.classList.remove('dragover');
            triggerCallback(e, callback);
        });

        ele.addEventListener('click', function() {
            input.value = null;
            input.click();
        });
    }
    window.makeDroppable = makeDroppable;
})(this);
(function(window) {
    makeDroppable(window.document.querySelector('.demo-droppable'), function(files) {
        console.log("File obtained");
        var output = document.querySelector('.output');
        output.innerHTML = '';
        for(var i=0; i<files.length; i++) {
            if(files[i].type.indexOf('image/') === 0) {
                output.innerHTML += '<img name="im1" id="im1" style="width: 91%; height: 95%;" ' +
                    'src="' + URL.createObjectURL(files[i]) + '" />';
                document.getElementById('imgChange').value = 'true';
            }
            else {
                alert("only images!!!!!");
                output.preventDefault();
            }
            var fname = document.getElementById('filename');
            fname.innerHTML = files[i].name;
            var filename = files[i].name;
            var trimmedName = filename.substring(0, filename.length-4);
            document.getElementById('stname').value = trimmedName;
            document.getElementById('lname').value = trimmedName;
        }
    });
})(this);
//NEW SCRIPT FOR DRAGNDROP