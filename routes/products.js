let type = require('../cloud/modules/type');
let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');
let multer = require('multer');
let fs = require('fs');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("Dest " + JSON.stringify(file));
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

let upload = multer({storage: storage});

module.exports = function (app) {

    app.get('/products', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Product).find();

            }).then(function (products) {

                res.render("pages/products/products", {
                    products: products
                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/');

            })
        } else {
            res.redirect('/');
        }
    });

    app.get('/product/:productId', function (req, res) {

        let token = req.cookies.token;
        let productId = req.params.productId;
        let page;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return Parse.Promise.when(
                    new Parse.Query(_class.Product).equalTo("objectId", productId).first(),
                    new Parse.Query(_class.Product).find()
                );

            }).then(function (product, products) {

                console.log("PRODUCT " + JSON.stringify(product));
                console.log("PRODUCTS " + JSON.stringify(products));

                page = util.page(products, productId);

                console.log("PAGES " + JSON.stringify(page));

                res.render("pages/products/product", {
                    product: product,
                    next: page.next,
                    previous: page.previous

                })
            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/products');
            })
        } else {
            res.redirect('/');
        }
    });


};