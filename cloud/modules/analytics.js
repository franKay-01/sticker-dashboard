let admin = require('firebase-admin');
let serviceAccount = require('../../service_accounts/cyfa');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gsticker-market-place.firebaseio.com/"
});

let database = admin.database();


let REQUEST_TYPE = {
    get: 0,
    set: 1
};

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
 * @param {string} opt.request - request type is either set or anything - for convenience use REQUEST_TYPE.get
 */
exports.request = (opt) => {

    let reference = database.ref(opt.reference);
    let viewCount = reference.child(opt.id + "/" + getType(opt.type) + "/count");

    viewCount.transaction(function (count) {

        if (opt.request === REQUEST_TYPE.set) {
            count += 1;
        }
        return count

    })
};

/**
 * @param {object} opt - objects
 * @param {string} opt.reference - reference object e.g sticker, story, pack
 */
exports.event = (opt) => {

    return  database.ref(opt.reference).once('value');

};


/**
 * @param {object} opt - objects
 * @param {string} opt.items - a return list of items from firebase
 * @param {string} opt.type - type is views,shares,downloads,used
 */
exports.process = (opt) => {

    let data = [];
    opt.items.forEach(item => {
        let id = item.key;
        let value = item.val();
        let count = value[opt.type].count;
        data.push({id:id,count:count});
    });

    return data;

};

exports.REQUEST_TYPE = REQUEST_TYPE;
exports.ANALYTIC_TYPE = ANALYTIC_TYPE;
exports.ANALYTIC_TYPE_STRING = ANALYTIC_TYPE_STRING;
exports.FIREBASE_REFERENCE = FIREBASE_REFERENCE;
