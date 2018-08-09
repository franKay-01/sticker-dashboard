$(document).ready(function () {

    $(function () {

        let selectedItems = [];
        let counter = 0;
        let word;
        $('#easySelectable').easySelectable({
            onSelected: function (el) {
                selectedItems.push(el.attr("data-id"))
                el.css({
                    // "border-color": "#00bcd4",
                    "border-color": "#e57373",
                    "border-width": "2px",
                    "border-style": "solid"
                });
                counter = counter + 1;
                $("#stickerIds").val(selectedItems);
                $('.add-sticker-btn').removeAttr('disabled');
                word = 'ADD ' + counter + ' STICKER(S)';
                word = word.bold();
                $('.add-sticker-btn').html(word);

            },
            onUnSelected: function (el) {
                selectedItems = selectedItems.filter(function (obj) {
                    return obj !== el.attr("data-id");
                });
                el.css({"border": "none"});
                $("#stickerIds").val(selectedItems);
                counter = counter - 1;
                word = 'ADD ' + counter + ' STICKER(S)';
                word = word.bold();

                $('.add-sticker-btn').html(word);

                if (selectedItems.length === 0) {
                    word = 'ADD STICKER(S)';
                    word = word.bold();

                    $('.add-sticker-btn').attr("disabled", true);
                    $('.add-sticker-btn').html(word);
                }
            }
        });
    });
});