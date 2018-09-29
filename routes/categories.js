let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let _ = require('underscore');
let type = require('../cloud/modules/type');
let multer = require('multer');
let fs = require('fs');

const PARSE_LIMIT = 2000;

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
