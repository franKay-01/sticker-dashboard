$(function(){
    var selectedItems = [];
    $('#easySelectable').easySelectable({
        onSelected: function (el) {
            selectedItems.push(el.attr("data-id"))

            console.log("onSelected")
            console.log(selectedItems)
        },
        onUnSelected: function (el) {
            selectedItems = selectedItems.filter(function( obj ) {
                return obj !== el.attr("data-id");
            });

            console.log("onUnSelected")
            console.log(selectedItems)
        }
    });
})