let serviceAccount = require('../../service_accounts/cyfa');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gsticker-market-place.firebaseio.com/"
});

let database = admin.database();

/**
 * Represents a book.
 * @constructor
 * * @param {object} opt - objects contain
 * @param {string} opt.reference - reference object sticker, story, pack.
 * @param {string} opt.type - type is views,shares,downloads,used
 */
let get = (opt) => {

    let reference = db.ref(opt.reference);
    let viewCount = reference.child(opt.id + "/"+ opt.type  +"/count");

    viewCount.transaction(function (count) {

        count += 1;
        return count

    })

};

exports.get = get;