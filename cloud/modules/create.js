const _ = require('underscore');
const type = require('./type');

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

exports.Adverts = (advert, links, advertImages) => {


    //TODO add mobile to types
    let _advert = {};

    _advert.id = advert.id;
    _advert.title = advert.get("title");
    _advert.description = advert.get("description");
    _advert.buttonAction = advert.get("buttonAction");

    _.each(links, link => {

        if (advert.id === link.get("object_id")) {

            const _link = link.get("link");

            switch (parseInt(link.get("type"))) {
                case type.LINKS.android :
                    if (_advert.android)
                        _advert.android.link = _link;
                    else
                        _advert.android = {};
                    _advert.android.link = _link;
                    break;

                case type.LINKS.ios :
                    if (_advert.ios)
                        _advert.ios.link = _link;
                    else
                        _advert.ios = {};
                    _advert.ios.link = _link;
                    break;

                case type.LINKS.web :
                    if (_advert.web)
                        _advert.web.link = _link;
                    else
                        _advert.web = {};
                    _advert.web.link = _link;
                    break;
            }
        }
    });

    //TODO optimise ios specific objects
    _.each(advertImages, advertImage => {

        if (advert.id === advertImage.get("advert_id")) {

            const uri = advertImage.get("uri").url();

            switch (parseInt(advertImage.get("type"))) {
                case type.LINKS.android :
                    if (_advert.android)
                        _advert.android.imageUrl = uri;
                    else
                        _advert.android = {};
                    _advert.android.imageUrl = uri;
                    break;

                case type.LINKS.ios :
                    if (_advert.ios)
                        _advert.ios.imageUrl = uri;
                    else
                        _advert.ios = {};
                    _advert.ios.imageUrl = uri;
                    break;

                case type.LINKS.web :
                    if (_advert.web)
                        _advert.web.imageUrl = uri;
                    else
                        _advert.web = {};
                    _advert.web.imageUrl = uri;
                    break;
            }
        }

    });

    return _advert;
};