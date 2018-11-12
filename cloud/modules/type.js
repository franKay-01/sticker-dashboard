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
    super: 0,
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
    //html color
    color: 14,
    link: 15,
    source: 16,
    backgroundColor: 17
};

exports.PACK_TYPE = {
    grouped: 0,
    themed: 1,
    curated: 2
};

exports.STORY_TYPE = {
    short_stories: 0,
    story: 1,
    jokes: 2,
    quotes: 3,
    facts: 4,
    history: 5,
    news: 6,
    episodes: 7
};

exports.FORMAT_TYPE = {
    default: 0,
    sideImage: 1,
    text: 2,
    backgroundImage: 3,
    regular: 4,
    gradient: 5
};

exports.ITEM_TYPE = {
    story: "story",
    pack: "pack"
};

exports.FEED_TYPE = {
    sticker: 0,
    story: 1
};

exports.DEFAULT = {
    colors: {
        "topColor":"#df5A34",
        "bottomColor":"#814ea4"
    }
};

exports.COLOR_TYPE = {
    color1: {
        "topColor":"#df5A34",
        "bottomColor":"#814ea4"
    },
    color2: {
        "topColor":"#d9dadf",
        "bottomColor":"#16a433"
    },
    color3: {
        "topColor":"#df4a73",
        "bottomColor":"#a47b14"
    },
    color4: {
        "topColor":"#d9dadf",
        "bottomColor":"#a40a1d"
    },
    color5: {
        "topColor":"#0bb4ab",
        "bottomColor":"#a4390d"
    },
    color6: {
        "topColor":"#b43b74",
        "bottomColor":"#9ca49f"
    },
    color7: {
        "topColor":"#96b422",
        "bottomColor":"#9ca49f"
    }

};




















