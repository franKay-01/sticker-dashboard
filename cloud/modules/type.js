exports.MESSAGES = {
    visitor: 0,
    creator: 1,
    brand: 2
};

exports.PACK_STATUS = {
    pending: 0,
    review: 1,
    approved: 2,
    rejected:3
};

exports.USER = {
    "super": 0,
    normal: 2,
    team:3
};

exports.LINKS = {
    //TODO change ios and android to mobile
    //TODO add social as a links type
    mobile: 0,
    web: 1,
    telephone: 2,
    facebook: 3,
    twitter: 4,
    instagram: 5,
    social:6
};

exports.ADVERT_IMAGE_TYPE = {
    mobile: 0, //200 * 200 size
    web: 1, //450 * 450
    banner: 2 //1024 * 1024
};

exports.STORY_ITEM = {
    text: 0,
    image: 1,
    quote: 2,
    sticker: 3,
    divider: 4,
    italic: 5,
    bold: 6,
    advert:7,
    italicBold:8,
    heading: 9,
    list:10,
    sideNote:11,
    greyArea:12,
    html:13,
    color: 14
};

exports.PACK_TYPE = {
    grouped: 0,
    themed: 1,
    curated: 2
};

exports.STORY_TYPE = {
    short_stories: 0,
    story: 1,
    jokes: 2
};

exports.DEFAULT = {
    colors: {
        "topColor":"#df5A34",
        "bottomColor":"#814ea4"
    }
};