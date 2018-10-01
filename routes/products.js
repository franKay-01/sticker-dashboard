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

    app.post('/product', function (req, res) {

        let token = req.cookies.token;
        let name = req.body.product_name;
        let description = req.body.product_description;
        let products = '/products';
        let productObject = {"android": "", "ios": ""};

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                let ProductsID = new Parse.Object.extend(_class.Product);
                let productId = new ProductsID();

                productId.set("name", name);
                productId.set("description", description);
                productId.set("userId", _user.id);
                productId.set("published", false);
                productId.set("productId", productObject);
                productId.set("price", productObject);

                return productId.save();

            }).then(function (product) {

                console.log("MADE " + JSON.stringify(product));

                res.redirect(products);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(products)
            })
        }
    });

    app.post('/product/edit/:productId', upload.array('art'), function (req, res) {

        let token = req.cookies.token;
        let files = req.files;
        let id = req.params.productId;
        let name = req.body.name;
        let description = req.body.description;
        let android = req.body.android;
        let android_price = req.body.android_price;
        let ios_price = req.body.ios_price;
        let ios = req.body.ios;
        let _previews;
        let parseFile;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                if (files.length > 0) {

                    return util.thumbnail(files)

                } else {

                    return "";
                }

            }).then(previews => {

                console.log("PREVIEW 2 " + JSON.stringify(previews));
                _previews = previews;

                return new Parse.Query(_class.Product).equalTo("objectId", id).first();

            }).then(function (product) {

                if (files.length > 0) {

                    let fullName = files[0].originalname;
                    let stickerName = fullName.substring(0, fullName.length - 4);

                    let bitmap = fs.readFileSync(files[0].path, {encoding: 'base64'});

                    let bitmapPreview;
                    let parseFilePreview = "";


                    bitmapPreview = fs.readFileSync(_previews[0].path, {encoding: 'base64'});
                    parseFilePreview = new Parse.File(stickerName, {base64: bitmapPreview}, _previews[0].mimetype);
                    parseFile = new Parse.File(stickerName, {base64: bitmap}, files[0].mimetype);

                    product.set("artwork", parseFile);
                    product.set("preview", parseFilePreview);

                }

                product.set("name", name);
                product.set("description", description);
                product.set("productId", {"android": android, "ios": ios});
                if (android_price && ios_price) {

                    product.set("price", {"android": android_price, "ios": ios_price});

                } else if (android_price) {

                    product.set("price", {"android": android_price, "ios": product.get("price").ios});

                } else if (ios_price) {

                    product.set("price", {"android": product.get("price").android, "ios": ios_price});

                }

                return product.save();


            }).then(function (productItem) {

                if (files.length > 0) {
                    let tempFile = files[0].path;
                    fs.unlink(tempFile, function (err) {
                        if (err) {
                            //TODO handle error code
                            console.log("-------Could not del temp" + JSON.stringify(err));
                        }
                        else {
                            console.log("SUUCCCEESSSSS IN DELTEING TEMP");
                        }
                    });
                }

                res.redirect('/product/edit/' + id);

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/product/edit/' + id);

            })
        }
        else {
            res.redirect('/');
        }
    });

    app.get('/product/edit/:productId', function (req, res) {

        let token = req.cookies.token;
        let productId = req.params.productId;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Product).equalTo("objectId", productId).first();

            }).then(function (product) {

                res.render("pages/products/product_details", {
                    product: product
                });

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect("/product/" + productId);
            })
        } else {
            res.redirect('/');
        }

    });

};