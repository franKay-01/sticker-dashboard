const _ = require('underscore');
const type = require('./type');
const helper = require('./helpers');
const _class = require('./classNames');

const ADMIN = process.env.ADMIN;
const DEFAULT_PROJECT = process.env.DEFAULT_PROJECT;

exports.Packs = opt => {

    let limit = opt.limit;
    let keyword = opt.keyword;
    let projectId = opt.projectId;

    if (!projectId) {
        projectId = DEFAULT_PROJECT
    }
    if (!limit) {
        limit = 1000
    }

    let query = new Parse.Query(_class.Packs);
    query.equalTo("published", true);
    query.containedIn("projectIds", [projectId]);
    if (keyword) {
        if (keyword !== "") {
            query.containedIn("keywords", [keyword.toUpperCase()]);
        }
    }
    query.limit(limit);
    query.equalTo("userId", ADMIN);
    query.descending("createdAt");

    return query.find({useMasterKey: true})
};
