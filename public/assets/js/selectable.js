$(document).ready(function () {

    $(function () {

        let selectedItems = [];
        let counter = 0;
        $('#easySelectable').easySelectable({
            onSelected: function (el) {
                selectedItems.push(el.attr("data-id"))
                el.css({
                    "border-color": "#00bcd4",
                    "border-width": "2px",
                    "border-style": "solid"
                });
                counter = counter + 1;
                $("#stickerIds").val(selectedItems);
                $('.add-sticker-btn').removeAttr('disabled');
                $('.add-sticker-btn').html('ADD ' + counter + ' STICKER(S)');
            },
            onUnSelected: function (el) {
                selectedItems = selectedItems.filter(function (obj) {
                    return obj !== el.attr("data-id");
                });
                el.css({"border": "none"});
                $("#stickerIds").val(selectedItems);
                counter = counter - 1;
                $('.add-sticker-btn').html('ADD ' + counter + ' STICKER(S)');


                if (selectedItems.length === 0) {
                    $('.add-sticker-btn').attr("disabled", true);
                    $('.add-sticker-btn').html('ADD STICKER(S)');
                }
            }
        });
    });
});