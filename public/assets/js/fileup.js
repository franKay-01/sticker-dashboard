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
        input.setAttribute('multiple', true);
        input.setAttribute('name', 'ffile');
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

        ele.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            ele.classList.remove('dragover');
        });

        ele.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            ele.classList.remove('dragover');
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
        console.log(files);
        var output = document.querySelector('.output');
        output.innerHTML = '';
        for(var i=0; i<files.length; i++) {
            if(files[i].type.indexOf('image/') === 0) {
                output.innerHTML += '<img width="200" src="' + URL.createObjectURL(files[i]) + '" />';
            }
            else {
                alert("only images!!!!!");
                output.preventDefault();
            }
            var filename = document.getElementById('filename');
            filename.innerHTML = files[i].name;
            console.log("File details" + ffile);
        }
    });
})(this);
//NEW SCRIPT FOR DRAGNDROP