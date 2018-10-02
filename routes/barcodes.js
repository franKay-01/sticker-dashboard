let _class = require('../cloud/modules/classNames');
let util = require('../cloud/modules/util');

module.exports = function (app) {

    app.post('/barcode', function (req, res) {

        let token = req.cookies.token;
        let number = req.body.barcode_amount;
        let card_name = req.body.barcode_name;
        let barcodes = [];

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                return new Parse.Query(_class.Barcodes).count();


            }).then(function (barcode_count) {
                let interger = barcode_count;
                let psyhertxt = "psyhertxt";

                let name_of_card = psyhertxt.concat(card_name);

                for (let i = 0; i < number; i++) {

                    let Barcodes = new Parse.Object.extend(_class.Barcodes);
                    let barcode = new Barcodes();

                    interger = interger + 1;
                    let name = name_of_card.concat(interger);

                    barcode.set("name", name);
                    barcodes.push(barcode);

                }

                return Parse.Object.saveAll(barcodes);

            }).then(function () {

                res.redirect('/barcodes');

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/barcode');
            })

        } else {
            res.redirect('/')
        }

    });

    app.get('/barcodes', function (req, res) {

        let token = req.cookies.token;

        if (token) {
            util.getUser(token).then(function (sessionToken) {

                let Barcodes = Parse.Object.extend(_class.Barcodes);
                let barcodes = new Parse.Query(Barcodes);
                barcodes.find({

                    success: function (bars) {
                        res.render("pages/barcodes/get_barcode", {
                            barcodes: bars
                        });
                    },
                    error: function (error) {
                        console.log("Error: " + error.code + " " + error.message);
                        res.redirect('/barcodes');
                    }
                });
            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/');
            })
        } else {
            res.redirect("/");
        }

        //     getUser(token).then(function (sessionToken) {
        //
        //         return new Parse.Query(Barcode).find();
        //
        //     }).then(function (barcode) {
        //
        //         console.log("BARCODES " + JSON.stringify(barcode));
        //
        //         res.render("pages/get_barcode", {
        //             barcodes: barcode
        //         });
        //
        //     })
        //
        // } else {
        //     res.redirect('/');
        // }

    });

    app.get('/barcode', function (req, res) {

        let token = req.cookies.token;

        if (token) {

            util.getUser(token).then(function (sessionToken) {

                res.render("pages/barcodes/create_barcode");

            });
        } else {
            res.redirect('/');
        }

    });

};