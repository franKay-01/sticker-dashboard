const _ = require('underscore');
const type = require('./type');
const helper = require('./helpers');

exports.StoryDetails = story => {
  let _story = {};

  if (sticker) {
    _story.title = story.get("title");
    _story.keywords = story.get("keywords");
    _story.summary = story.get("summary");
    _story.published = story.get("published");
    _story.authorId = story.get("authorId");
    _story.type = story.get("storyType");
    _story.info = story.get("info");
  }
  console.log("STORY DETAILS ###" + JSON.stringify(_story));
  return _story;

};

exports.Stories = (stories) => {
  let _stories = [];

  if (stories.length) {
    _.each(stories, story => {

      _stories.push({id: story.id, title: story.get("title"), summary: story.get("summary")})

  });
 }

  return _stories;
};

exports.Packs = (packs) => {
  let _packs = [];

  if (packs.length) {
      _.each(packs, pack => {
        if (pack.get("artwork")){

          _packs.push({id: pack.id, name: pack.get("name"), type: pack.get("packType"), art: pack.get("artwork").url() });

        }else {

          _packs.push({id: pack.id, name: pack.get("name"), type: pack.get("packType"), art: ""});

        }

      });
  }
  return _packs;
}

exports.StickerItem = sticker => {
  let _sticker = {};

  if (sticker) {
    _sticker.name = sticker.get("name");
    _sticker.art = sticker.get("uri").url();
    _sticker.description = sticker.get("description");
    _sticker.meaning = sticker.get("meaning");
    _sticker.sold = sticker.get("sold");
    _sticker.categories = sticker.get("categories");
  }

  return _sticker;

};

exports.PackItem = pack => {
  let _pack = {};

  if (pack) {

      _pack.id = pack.id;
      _pack.status = pack.get("status");
      if (pack.get("artwork") !== undefined){
        _pack.art = pack.get("artwork").url();
      }else {
        _pack.art = "";
      }
      _pack.description = pack.get("description");
      _pack.is_published = pack.get("published");
      _pack.name = pack.get("name");
      _pack.type = pack.get("packType");
      _pack.keywords = pack.get("keywords");
      _pack.productId = pack.get("productId");
      _pack.version = pack.get("version");
      _pack.archive = pack.get("archived");
      _pack.projects = pack.get("projectIds")
  }

  return _pack;
};

exports.ProjectItem = project => {
  let _project = [];

  if (project) {

      _project.push({id: project.id, name: project.get("name")});

  }
  return _project;
};

exports.SelectedCategories = (categories) => {
  let _categories = [];

  if (categories.length){
    _.each(categories, category => {

      _categories.push({id: helper.randomHash(), name: category});

    });
  }

  return _categories;
};

exports.Categories = (categories) => {
  let _categories = [];

  if (categories.length){
    _.each(categories, category => {
      _categories.push({value: category.id, label: category.get("name")});

    });
  }

  return _categories;
};

exports.StoryTitles = (stories) => {
  let _stories = [];

  if (stories.length) {
      _.each(stories, story => {

        _stories.push({id: story.id, name: story.get("title"), type: story.get("storyType")});

      });
  }
  return _stories;
};

exports.Projects = (projects) => {
  let _projects = [];

  if (projects.length) {
      _.each(projects, project => {
        if (project.get("uri")){
          _projects.push({id: project.id, name: project.get("name"), image: project.get("uri").url()});
        }else {
          _projects.push({id: project.id, name: project.get("name"), image: ""});
        }
      });
  }
  return _projects;
};

exports.CommonItems = (commonItems) => {
  let _products = [];

  if (commonItems.length) {
      _.each(commonItems, commonItem => {

        _products.push({id: commonItem.id, name: commonItem.get("name")});

      });
  }
  return _products;
};

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
        _pack.shareUrl = "http://share.cyfa.io/pack/" + pack.id;

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
                _pack.previews.push({id:"p"+helper.hash(),url:preview})
            });

        }
    }

    return _pack;

};

exports.Story = (story) => {

    let _story = {};

    if (story) {
        _story.id = story.id;
        _story.title = story.get("title");
        _story.summary = story.get("summary");
        _story.views = 0;
        _story.shareUrl = "http://share.cyfa.io/story/" + story.id;


        let colors = story.get("info");
        if (colors.topColor === "" || colors.bottomColor === "") {
            _story.colors = type.DEFAULT.colors;
        } else {
            _story.colors = story.get("info");
        }

    }

    return _story;

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
