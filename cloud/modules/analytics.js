let admin = require('firebase-admin');
let serviceAccount = require('../../service_accounts/cyfa');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gsticker-market-place.firebaseio.com/"
});

let database = admin.database();

let ANALYTIC_TYPE = {
    views: 0,
    shares: 1,
    downloads: 2,
    used: 3
};

let ANALYTIC_TYPE_STRING = {
    views: "views",
    shares: "shares",
    downloads: "downloads",
    rated: "rated",
    used: "used"
};

let FIREBASE_REFERENCE = {
    sticker: "sticker",
    stickers: "stickers",
    story: "story",
    stories: "stories",
    pack: "pack",
    packs: "packs"
};

/*
views: 0,
shares: 1,
downloads: 2,
used:3
* */
/**
 * @param {number} type - request type values views:0, shares:1, downloads:2, used:3
 */
let getType = (type) => {
    switch (type) {
        case 0 :
            return ANALYTIC_TYPE_STRING.views;

        case 1 :
            return ANALYTIC_TYPE_STRING.shares;

        case 2 :
            return ANALYTIC_TYPE_STRING.downloads;

        case 3 :
            return ANALYTIC_TYPE_STRING.used;

    }
};

/**
 * @param {object} opt - objects contain
 * @param {string} opt.reference - reference object e.g sticker, story, pack.
 * @param {string} opt.type - type is views,shares,downloads,used
 * @param {string} opt.id - the id of the item
 */
exports.request = (opt) => {

    ///add environment
    ///add API Key 8e50a3f8-2108-4b40-b889-ba949f73df0a
    //use API to secure the data

    let type = opt.type;
    let reference = opt.reference;
    let id = opt.id;

    let viewCount = database.ref(process.env.ANALYTICS_KEY).child(reference)
        .child(id + "/" + getType(type) + "/count");

    viewCount.transaction(function (count) {
        count += 1;
        return count;

    });
};

/**
 * @param {object} opt - objects
 * @param {string} opt.reference - reference object e.g sticker, story, pack
 */
exports.event = (opt) => {

    return database.ref(process.env.ANALYTICS_KEY + "/" + opt.reference).once('value');

};


/**
 * @param {object} opt - objects
 * @param {string} opt.items - a return list of items from firebase
 * @param {string} opt.typeString - type is views,shares,downloads,used
 */
exports.formatted = (opt) => {

    let data = [];
    let items = opt.items;
    if (items !== undefined || items !== "undefined") {
            opt.items.forEach(item => {
                let id = item.key;
                let value = item.val()[opt.typeString].count;
                data.push({id: id, value: value});
            });
    }

    return data;

};

exports.getCount = (opt) => {
    let data = opt.data;
    console.log("DATA " + data);
    if (data !== undefined || data !== "undefined") {
        opt.items.forEach(item => {
            if (item.val()) {
                let count = item.val()[opt.typeString].count;
                if (count) {
                    return count;
                }
            }
        });
    }
    return 0;
};

exports.ANALYTIC_TYPE = ANALYTIC_TYPE;
exports.ANALYTIC_TYPE_STRING = ANALYTIC_TYPE_STRING;
exports.FIREBASE_REFERENCE = FIREBASE_REFERENCE;
