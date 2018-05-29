let util = require("../modules/util");
let helpers = require("../modules/helpers");
let _ = require('underscore');

let PacksClass = "Packs";

Parse.Cloud.define("getPacks", function (req, res) {

    let _packs = [];

    return new Parse.Query(PacksClass).equalTo("user_id", process.env.ADMIN).find({useMasterKey: true})
        .then(function (packs) {

            _packs = packs;

            let promises = _.map(packs, function (pack) {
                return pack.relation(PacksClass).query().find({useMasterKey: true});
            });

         //   return Parse.Promise.when(promises);

            //  return stickers.query().find({useMasterKey: true});

        }).then(function (stickerList) {

            /*
            preview:[url],
            stickers[{}]
            name:
            description
            sold:bool
            * */

            console.log("Stickers----------------");
            console.log(JSON.stringify(stickerList[0]));

            let stickerObjects = [];

            //todo check if pack is published
            //todo check if pack has not been archived
            _.map(_packs, pack => {

                let packItem = {};
                packItem.name = pack.get("pack_name");
                packItem.description = pack.get("pack_description");
                packItem.artwork = pack.get("art_work").url();

                console.log("packItem");
                console.log(JSON.stringify(packItem));

                let arr = [{
                    "stickerName": "mumu_notxt",
                    "localName": "mumu_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "fbfa9199887f8eee3909c1928c978c10_mumu_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/fbfa9199887f8eee3909c1928c978c10_mumu_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:00.701Z",
                    "updatedAt": "2018-04-25T17:01:00.701Z",
                    "objectId": "2V298dyXIv"
                }, {
                    "stickerName": "emoji sticker pack-45",
                    "localName": "emoji sticker pack-45",
                    "uri": {
                        "__type": "File",
                        "name": "b89c551ee4a41a9035403458359f3baa_emoji sticker pack-45.png",
                        "url": "https://cyfa.s3.amazonaws.com/b89c551ee4a41a9035403458359f3baa_emoji%20sticker%20pack-45.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T16:58:17.589Z",
                    "updatedAt": "2018-04-25T16:58:17.589Z",
                    "objectId": "50YViGIW2n"
                }, {
                    "stickerName": "emoji sticker pack-47",
                    "localName": "emoji sticker pack-47",
                    "uri": {
                        "__type": "File",
                        "name": "98bdc0e8b5d95451491333263e830644_emoji sticker pack-47.png",
                        "url": "https://cyfa.s3.amazonaws.com/98bdc0e8b5d95451491333263e830644_emoji%20sticker%20pack-47.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T16:56:48.610Z",
                    "updatedAt": "2018-04-25T16:56:48.610Z",
                    "objectId": "9EQxAVbhoO"
                }, {
                    "stickerName": "emoji sticker pack-52",
                    "localName": "emoji sticker pack-52",
                    "uri": {
                        "__type": "File",
                        "name": "208836babd7f13ca8e53f18eba862754_emoji sticker pack-52.png",
                        "url": "https://cyfa.s3.amazonaws.com/208836babd7f13ca8e53f18eba862754_emoji%20sticker%20pack-52.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T16:55:55.265Z",
                    "updatedAt": "2018-04-25T16:55:55.265Z",
                    "objectId": "BZL1gS5G19"
                }, {
                    "stickerName": "emoji sticker pack-48",
                    "localName": "emoji sticker pack-48",
                    "uri": {
                        "__type": "File",
                        "name": "0badf33040e2d3084af6040fc5385710_emoji sticker pack-48.png",
                        "url": "https://cyfa.s3.amazonaws.com/0badf33040e2d3084af6040fc5385710_emoji%20sticker%20pack-48.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T16:56:48.610Z",
                    "updatedAt": "2018-04-25T16:56:48.610Z",
                    "objectId": "D2DqcVBwKR"
                }, {
                    "stickerName": "woz_notxt",
                    "localName": "woz_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "9f34c69d540ee8902a4a01e30efa7f44_woz_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/9f34c69d540ee8902a4a01e30efa7f44_woz_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:00:00.401Z",
                    "updatedAt": "2018-04-25T17:00:00.401Z",
                    "objectId": "HgwhmD8qxA"
                }, {
                    "stickerName": "you_no_try_notxt",
                    "localName": "you_no_try_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "212401088a0b88b5da0dc12c948dee3e_you_no_try_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/212401088a0b88b5da0dc12c948dee3e_you_no_try_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:00:00.402Z",
                    "updatedAt": "2018-04-25T17:00:00.402Z",
                    "objectId": "IcJmLvLRmu"
                }, {
                    "stickerName": "amebo_notxt",
                    "localName": "amebo_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "e6042e7f5c4918d1192e42cc0922a964_amebo_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/e6042e7f5c4918d1192e42cc0922a964_amebo_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:38.903Z",
                    "updatedAt": "2018-04-25T17:01:38.903Z",
                    "objectId": "LwTEoKuDBx"
                }, {
                    "stickerName": "emoji sticker pack-43",
                    "localName": "emoji sticker pack-43",
                    "uri": {
                        "__type": "File",
                        "name": "e1343efa75c2c1e5404845d9577cad2f_emoji sticker pack-43.png",
                        "url": "https://cyfa.s3.amazonaws.com/e1343efa75c2c1e5404845d9577cad2f_emoji%20sticker%20pack-43.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T16:58:17.583Z",
                    "updatedAt": "2018-04-25T16:58:17.583Z",
                    "objectId": "OqUH54MivJ"
                }, {
                    "stickerName": "lobaton_notxt",
                    "localName": "lobaton_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "39dab6c1d8840e7510128413bae4e829_lobaton_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/39dab6c1d8840e7510128413bae4e829_lobaton_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:00.701Z",
                    "updatedAt": "2018-04-25T17:01:00.701Z",
                    "objectId": "WBdS1vdr2z"
                }, {
                    "stickerName": "emoji sticker pack-42",
                    "localName": "emoji sticker pack-42",
                    "uri": {
                        "__type": "File",
                        "name": "ac28f879fc66a8a5ffc891adc0dadcea_emoji sticker pack-42.png",
                        "url": "https://cyfa.s3.amazonaws.com/ac28f879fc66a8a5ffc891adc0dadcea_emoji%20sticker%20pack-42.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T16:58:17.583Z",
                    "updatedAt": "2018-04-25T16:58:17.583Z",
                    "objectId": "bKFE5bRD6Z"
                }, {
                    "stickerName": "oya_relax_notxt",
                    "localName": "oya_relax_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "05976646c2fd0cd0db8e64e98f3708b5_oya_relax_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/05976646c2fd0cd0db8e64e98f3708b5_oya_relax_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:00.701Z",
                    "updatedAt": "2018-04-25T17:01:00.701Z",
                    "objectId": "crzzDfyB9u"
                }, {
                    "stickerName": "waka_notxt",
                    "localName": "waka_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "543860a2b3a2d347a10d2bebf6d64b21_waka_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/543860a2b3a2d347a10d2bebf6d64b21_waka_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:00:00.401Z",
                    "updatedAt": "2018-04-25T17:00:00.401Z",
                    "objectId": "fXmoRcekKG"
                }, {
                    "stickerName": "emoji sticker pack-51",
                    "localName": "emoji sticker pack-51",
                    "uri": {
                        "__type": "File",
                        "name": "282a11cba6f9a4f59616901eccde4175_emoji sticker pack-51.png",
                        "url": "https://cyfa.s3.amazonaws.com/282a11cba6f9a4f59616901eccde4175_emoji%20sticker%20pack-51.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T16:55:55.265Z",
                    "updatedAt": "2018-04-25T16:55:55.265Z",
                    "objectId": "h4Xi2c4MPk"
                }, {
                    "stickerName": "emoji sticker pack-44",
                    "localName": "emoji sticker pack-44",
                    "uri": {
                        "__type": "File",
                        "name": "28dc98f4569a87c505d80bdf21335b0c_emoji sticker pack-44.png",
                        "url": "https://cyfa.s3.amazonaws.com/28dc98f4569a87c505d80bdf21335b0c_emoji%20sticker%20pack-44.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T16:58:17.583Z",
                    "updatedAt": "2018-04-25T16:58:17.583Z",
                    "objectId": "iBt2xQARY1"
                }, {
                    "stickerName": "baff_up_notxt",
                    "localName": "baff_up_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "54aa6d8a35fcc78c44d5a1257ef99c32_baff_up_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/54aa6d8a35fcc78c44d5a1257ef99c32_baff_up_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:38.903Z",
                    "updatedAt": "2018-04-25T17:01:38.903Z",
                    "objectId": "l1Krkc8oYh"
                }, {
                    "stickerName": "stop",
                    "localName": "stop",
                    "uri": {
                        "__type": "File",
                        "name": "98d15ad15ffc69c3921deca6c78814a3_stop.png",
                        "url": "https://cyfa.s3.amazonaws.com/98d15ad15ffc69c3921deca6c78814a3_stop.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:00.701Z",
                    "updatedAt": "2018-04-25T17:01:00.701Z",
                    "objectId": "mrN8RJQkAr"
                }, {
                    "stickerName": "baff_up_2_notxt",
                    "localName": "baff_up_2_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "17edea3a5931c03b196b3dd0f400c44a_baff_up_2_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/17edea3a5931c03b196b3dd0f400c44a_baff_up_2_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:38.903Z",
                    "updatedAt": "2018-04-25T17:01:38.903Z",
                    "objectId": "nPIz915KXq"
                }, {
                    "stickerName": "awoof_notxt",
                    "localName": "awoof_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "34819bd8437babaf1bb2925336d1e6ed_awoof_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/34819bd8437babaf1bb2925336d1e6ed_awoof_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:38.903Z",
                    "updatedAt": "2018-04-25T17:01:38.903Z",
                    "objectId": "r4LKUG10p8"
                }, {
                    "stickerName": "oyiwa_notxt",
                    "localName": "oyiwa_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "c6d7ca3b2dc680963d7cbcfeaeae0d59_oyiwa_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/c6d7ca3b2dc680963d7cbcfeaeae0d59_oyiwa_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {"__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"},
                    "flag": false,
                    "archive": false,
                    "sold": true,
                    "createdAt": "2018-04-25T17:01:00.701Z",
                    "updatedAt": "2018-04-25T17:01:00.701Z",
                    "objectId": "wCjKi3wTsW"
                }, {
                    "stickerName": "troway_notxt",
                    "localName": "troway_notxt",
                    "uri": {
                        "__type": "File",
                        "name": "514b0836876836021df858ad12716b21_troway_notxt.png",
                        "url": "https://cyfa.s3.amazonaws.com/514b0836876836021df858ad12716b21_troway_notxt.png"
                    },
                    "user_id": "uyJ1LmXk7F",
                    "parent": {
                        "__type": "Pointer", "className": "Packs", "objectId": "hB39Hhb16O"

                    },
                    "flag":
                        false, "archive":
                        false, "sold":
                        true, "createdAt":
                        "2018-04-25T17:00:00.401Z", "updatedAt":
                        "2018-04-25T17:00:00.401Z", "objectId":
                        "yj0ufXFqd6"
                },
                    {
                        "stickerName":
                            "emoji sticker pack-46", "localName":
                            "emoji sticker pack-46", "uri":
                            {
                                "__type":
                                    "File", "name":
                                    "266ebba57ab12e3e535ea6ccd47123de_emoji sticker pack-46.png", "url":
                                    "https://cyfa.s3.amazonaws.com/266ebba57ab12e3e535ea6ccd47123de_emoji%20sticker%20pack-46.png"
                            }
                        ,
                        "user_id":
                            "uyJ1LmXk7F", "parent":
                            {
                                "__type":
                                    "Pointer", "className":
                                    "Packs", "objectId":
                                    "hB39Hhb16O"
                            }
                        ,
                        "flag":
                            false, "archive":
                            false, "sold":
                            true, "createdAt":
                            "2018-04-25T16:58:17.589Z", "updatedAt":
                            "2018-04-25T16:58:17.589Z", "objectId":
                            "zgexZAzaUx"
                    }
                ];

                _.map(stickerList[0], function (stickers) {

                    console.log("Sticker List");

                    if (stickers.length !== 0) {

                        console.log("Sticker Length");
                        //todo choose five stickers for preview

                        let _stickers = [];
                        _.map(stickers, sticker => {

                            console.log("Stickers");
                            console.log(JSON.stringify(stickers));

                            if (pack.id === sticker.get("parent").id) {

                                console.log("Matches Parent");

                                _stickers.push(sticker)
                            }

                        });

                        packItem.stickers = [];
                        packItem.stickers = _stickers;
                        stickerObjects.push(packItem);
                        console.log("stickers");
                        console.log(JSON.stringify(packItem));

                    }
                });
            });


            res.success(util.setResponseOk(""));

        }, function (error) {

            util.handleError(res, error);
        });

});
