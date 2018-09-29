let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let helper = require('./cloud/modules/helpers');
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

};