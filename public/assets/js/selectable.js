$(document).ready(function () {

    $(function () {

        var selectedItems = [];
        $('#easySelectable').easySelectable({
            onSelected: function (el) {
                selectedItems.push(el.attr("data-id"))
                el.css({
                    "border-color": "#00bcd4",
                    "border-width": "2px",
                    "border-style": "solid"
                });
                $("#stickerIds").val(selectedItems);
                $('.add-sticker-btn').removeAttr('disabled');
                $('.add-sticker-btn').attr("background-color", "#a46580");

            },
            onUnSelected: function (el) {
                selectedItems = selectedItems.filter(function (obj) {
                    return obj !== el.attr("data-id");
                });
                el.css({"border": "none"});
                $("#stickerIds").val(selectedItems);

                if (selectedItems.length === 0) {
                    $('.add-sticker-btn').attr("disabled", true);
                }
            }
        });
    });
});