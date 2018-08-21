const _ = require('underscore');
const type = require('./type');

exports.Sticker = sticker => {

    let _sticker = {};

    if (sticker) {

        _sticker.id = sticker.id;
        _sticker.name = sticker.get("name");
        _sticker.description = sticker.get("description");
        _sticker.meaning = sticker.get("meaning");
        _sticker.categories = sticker.get("categories");

        let url = sticker.get("uri");
        if (url) {
            _sticker.url = url.url();
        } else {
            _sticker.url = "";
        }

        let preview = sticker.get("preview");
        if (preview) {
            _sticker.preview = preview.url();
        } else {
            _sticker.preview = "";
        }

        let sold = sticker.get("sold");

        if ((sold === "true") || (sold === true)) {
            _sticker.sold = true;
        } else {
            _sticker.sold = false;
        }

    }

    return _sticker;
};

exports.Category = category => {

    let _category = {};

    if (category) {
        _category.id = category.id;
        _category.name = category.get("name");
        let emoji = category.get("emoji");
        if (emoji) {
            _category.emoji = emoji;
        } else {
            _category.emoji = "";
        }
    }

    return _category;
};

exports.Pack = (pack) => {

    let _pack = {};

    if (pack) {

        _pack.id = pack.id;
        _pack.name = pack.get("name");
        _pack.description = pack.get("description");

        let artwork = pack.get("artwork");
        if (artwork) {
            _pack.artwork = artwork.url();
        } else {
            _pack.artwork = "";
        }

        let preview = pack.get("preview");
        if (preview) {
            _pack.preview = preview.url();
        } else {
            _pack.preview = "";
        }

        _pack.previews = [];
        let previews = pack.get("previews");
        if (previews) {
            _.each(previews,preview => {
                _pack.previews.push(preview)
            });

        }
    }

    return _pack;

};

exports.StoryArtwork = (story, sticker) => {

    if (story) {
        story.stickerName = sticker.get("name");

        if (sticker.get("uri")) {
            story.stickerUrl = sticker.get("uri").url();
        } else {
            story.stickerUrl = "";
        }
        if (sticker.get("preview")) {
            story.stickerPreviewUrl = sticker.get("preview").url();
        } else {
            story.stickerPreviewUrl = "";
        }
    }
    return story;

};

exports.StoryItems = (storyItems) => {
    let _storyItems = [];

    if (storyItems.length) {
        _.each(storyItems, storyItem => {
            _storyItems.push({id: storyItem.id, contents: storyItem.get("contents"), type: storyItem.get("type")});
        });
    }

    return _storyItems
};

//TODO
exports.Story = (story) => {

    let _story = {};

    if (story) {
        _story.id = story.id;
        _story.title = story.get("title");
        _story.summary = story.get("summary");
        _story.views = 0;

        let colors = story.get("color");
        if (colors) {
            _story.colors = colors
        } else {
            _story.colors = type.DEFAULT.colors
        }
    }

    return _story;

};


exports.Adverts = (advert, links, advertImages) => {

    //TODO add mobile to types
    let _advert = {};

    if (advert && links && advertImages) {
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

    }

    return _advert;
};