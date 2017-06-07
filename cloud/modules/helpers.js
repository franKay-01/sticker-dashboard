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


exports.truncateText = truncateText;
exports.randomHash = randomHash;
exports.hash = hash;
exports.getUsername = getUsername;