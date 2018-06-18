const _ = require('underscore');

exports.Sticker = sticker => {
    let _sticker = {};
    _sticker.id = sticker.id;
    _sticker.name = sticker.get("stickerName");
    _sticker.categories = sticker.get("categories");

    if (sticker.get("uri")) {
        _sticker.url = sticker.get("uri").url();
    } else {
        _sticker.url = "";
    }

    return _sticker;
};

exports.Category = category => {

    let _category = {};
    _category.id = category.id;
    _category.name = category.get("name");
    let emoji = category.get("emoji");
    if (emoji) {
        _category.emoji = emoji;
    } else {
        _category.emoji = "";
    }

    return _category;
};

exports.Pack = (pack, stickerList) => {

    let _pack = {};
    _pack.id = pack.id;
    _pack.name = pack.get("pack_name");
    _pack.description = pack.get("pack_description");

    let _artwork = pack.get("art_work");
    if (_artwork) {
        _pack.artwork = _artwork.url();
    } else {
        _pack.artwork = "";
    }

    let _stickers = [];
    _.map(stickerList, function (stickers) {

        if (stickers.length) {

            _.map(stickers, sticker => {

                if (pack.id === sticker.get("parent").id) {
                    _stickers.push({id: sticker.id, url: sticker.get("uri").url()});
                }

            });

            _pack.previews = _stickers;

        }
    });

    return _pack;

};

exports.Story = (story, sticker, storyItem) => {

    let _story = {};
    _story.id = story.id;
    _story.title = story.get("title");
    _story.summary = story.get("summary");
    _story.stickerName = sticker.get("stickerName");

    if (sticker.get("uri")) {
        _story.stickerUrl = sticker.get("uri").url();
    } else {
        _story.stickerUrl = "";
    }

    let colors = story.get("color");
    if (colors) {
        _story.colors = colors
    } else {
        _story.colors = type.DEFAULT.color
    }

    if (storyItem.length) {
        let _stories = [];
        _.each(storyItem, storyItem => {
            _stories.push({id: storyItem.id, content: storyItem.get("content"), type: storyItem.get("type")});
        });
        _story.stories = _stories;
    }

    return _story;

};