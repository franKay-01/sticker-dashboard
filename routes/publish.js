let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');

const STORIES = "story";
const PACKS = "pack";
const PRODUCT = "product";

module.exports = function (app) {

    app.get('/publish/:type/:status/:id/:projectId', function (req, res) {

        let token = req.cookies.token;
        let id = req.params.id;
        let projectId = req.params.projectId;
        let status = req.params.status;
        let type = req.params.type;
        let pack = "/pack/";
        let storyEdit = "/storyedit/";
        let productEdit = "/product/";

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                switch (type) {
                    case PACKS:
                        return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

                    case STORIES:
                        return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

                    case PRODUCT:
                        return new Parse.Query(_class.Product).equalTo("objectId", id).first();

                }

            }).then(function (object) {

                if (status === "publish") {
                    object.set("published", true);
                } else if (status === "unpublish") {
                    object.set("published", false);

                }

                return object.save();

            }).then(function () {

                switch (type) {
                    case PACKS:
                        if (status === "publish") {
                            res.redirect('/pack/create/previews/' + id + projectId);
                        } else if (status === "unpublish") {
                            res.redirect(pack + id + '/' + projectId);
                        }
                        return;

                    case STORIES:
                        res.redirect(storyEdit + id + '/' + projectId);
                        return;

                    case PRODUCT:
                        res.redirect(productEdit + id);
                        return;
                }

            }, function (error) {

                console.log("ERROR " + error.message);

                switch (type) {
                    case PACKS:
                        res.redirect(pack + id + '/' + projectId);
                        return;

                    case STORIES:
                        res.redirect(storyEdit + id + '/' + projectId);
                        return;

                    case PRODUCT:
                        res.redirect(productEdit + id);
                        return;
                }

            })
        } else {
            res.redirect('/');
        }

    });
};