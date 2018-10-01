let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let helper = require('../cloud/modules/helpers');
let _ = require('underscore');
let type = require('../cloud/modules/type');
let multer = require('multer');
let fs = require('fs');

const PARSE_LIMIT = 2000;

module.exports = function (app) {

    app.get('/categories', function (req, res) {
        let token = req.cookies.token;

        if (token) {

            new Parse.Query(_class.Categories).limit(PARSE_LIMIT).ascending().find().then(function (categories) {

                    let _categories = helper.chunks(categories, 4);

                    res.render("pages/categories/categories", {categories: _categories});
                },
                function (error) {
                    console.log("No categories found.............." + JSON.stringify(error));
                    res.redirect("/");

                });
        } else {
            res.redirect("/");
        }
    });

    app.post('/category', function (req, res) {

        let token = req.cookies.token;
        let categoryName = JSON.stringify(req.body.category_name);
        let _categories = [];
        let categoryDetails = [];

        categoryName = categoryName.substring(2, categoryName.length - 2);

        if (categoryName !== undefined || categoryName !== "undefined") {
            _categories = categoryName.split(",");
        }

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _categories.forEach(function (category) {

                    let Category = new Parse.Object.extend(_class.Categories);
                    let new_category = new Category();

                    new_category.set("name", category.toLowerCase());
                    categoryDetails.push(new_category);

                });

                return Parse.Object.saveAll(categoryDetails);

            }).then(function (result) {

                console.log("RESULTS " + JSON.stringify(result));

                res.redirect("/categories");

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/home");

            });
        }

        else {
            res.redirect("/");
        }
    });

    app.post('/category/update', function (req, res) {

        let token = req.cookies.token;
        let newName = req.body.catname;
        let currentId = req.body.categoryId;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query("Categories").equalTo("objectId", currentId).first()

            }).then(function (category) {

                category.set("name", newName);
                return category.save();

            }).then(function () {

                res.redirect("/categories");

            }, function (error) {

                console.error(error);
                res.redirect("/categories");

            });
        }
        else { //no session found
            res.redirect("/");
        }

    });

    app.post('/category/delete', function (req, res) {

        let token = req.cookies.token;
        let id = req.body.inputRemoveId;
        let categories = '/categories';

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Categories).equalTo("objectId", id).first();

            }).then(function (category) {
                    category.destroy({
                        success: function (object) {
                            console.log("removed" + JSON.stringify(object));
                            res.redirect(categories);
                        },
                        error: function (error) {
                            console.log("Could not remove" + error);
                            res.redirect(categories);

                        }
                    });
                },
                function (error) {
                    console.log("ERROR " + error);
                    res.redirect(categories);

                });
        }
        else { //no session found
            res.redirect("/");
        }

    });

    app.post('/category/find', function (req, res) {

        let token = req.cookies.token;
        let categoryName = req.body.searchCategory;

        if (token) {

            let searchCategory = new Parse.Query(_class.Categories);
            searchCategory.equalTo("name", categoryName);
            searchCategory.first().then(function (category) {

                    if (category) {
                        res.render("pages/categories/search_categories", {categories: category});
                    } else {
                        res.render("pages/categories/search_categories", {categories: []});
                    }

                },
                function (error) {
                    console.log("No categories found.............." + JSON.stringify(error));
                    searchErrorMessage = error.message;
                    res.redirect("/categories");
                });
        } else {
            res.redirect("/");
        }
    });


};