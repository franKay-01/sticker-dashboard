const _ = require('underscore');
const type = require('./type');
const helper = require('./helpers');

exports.Pack = opt => {

    let query = Parse.Query(_class.Packs);
    query.equalTo("published", true);
    query.containedIn("projectIds", [projectId]);
    query.containedIn("keywords", [opt.keyword]);
    query.limit(limit).equalTo("userId", ADMIN);
    query.descending("createdAt");

    return query.find({useMasterKey: true})
};
