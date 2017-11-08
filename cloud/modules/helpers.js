var crypto = require("crypto");

//create a hash string using base 16
hash = function () {
    return (((1 + Math.random()) * 0x1000000) | 0).toString(16).substring(1);
};

//create a base 16 hash string using dashes and 5 regenerations
randomHash = function () {
    return (hash() + "-" + hash() + "-" + hash() + "-" + hash());
};

truncateText = function (text) {
    // Validate the message text.
    // For example make sure it is under 140 characters
    if (text.length > 140) {
        // Truncate and add a ...
        return text.substring(0, 137) + "...";
    }
    return text;
};

/**
 * Return the SHA-1 hash of the given string
 *
 * @param s the string value to hash
 * @returns {*}
 */
getUsername = function (s) {
    var salt = "patient-cherry-5029-salt";
    var cyfa_url = "cyfa.io";
    //TODO update sha implementation
    var sha1 = crypto.createHash('sha1');
    sha1.update(s + salt);
    return sha1.digest('hex') + "@" + cyfa_url;
};

shuffle = function (array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

chunks = function (arr, chunkSize) {
    var groups = [], i;
    for (i = 0; i < arr.length; i += chunkSize) {
        groups.push(arr.slice(i, i + chunkSize));
    }
    return groups;
};

leadingZero = function (number) {
    if (number.toString().length === 1) {
        return "0" + number;
    } else {
        return number;
    }
};


exports.truncateText = truncateText;
exports.randomHash = randomHash;
exports.chunks = chunks;
exports.leadingZero = leadingZero;
exports.hash = hash;
exports.shuffle = shuffle;
exports.getUsername = getUsername;