//main imports
require('sqreen');
let express = require('express');
let ejs = require('ejs');
let ParseServer = require('parse-server').ParseServer;
let Parse = require("parse/node").Parse; // import the module
let S3Adapter = require('@parse/s3-files-adapter');
let Mailgun = require('mailgun-js');

//middleware for sessions and parsing forms
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
let cors = require('cors');
let methodOverride = require('method-override');
let moment = require('moment');


//for parsing location, directory and paths
let path = require('path');
let fs = require('fs');
let gm = require('gm').subClass({imageMagick: true});
let multer = require('multer');
let download = require('image-downloader');
let resolve = require('path').resolve;

//utility module for filtering lists
let _ = require('underscore');

//imported class
let helper = require('./cloud/modules/helpers');
let type = require('./cloud/modules/type');
let _class = require('./cloud/modules/classNames');
let util = require('./cloud/modules/util');
let notification = require('./cloud/modules/notifications');
let create = require('./cloud/modules/create');
let accountRoute = require('./routes/account');
let advertRoute = require('./routes/adverts');
let storyRoute = require('./routes/story');
let stickerRoute = require('./routes/stickers');
let categoryRoute = require('./routes/categories');
let newsLetterRoute = require('./routes/newsletter');
let reviewRoutes = require('./routes/reviews');
let packRoutes = require('./routes/packs');
let productRoutes = require('./routes/products');
let feedRoutes = require('./routes/feeds');

//google app engine configuration
//let config = require('./config.json');

//TODO create method to handle errors aka handleError
let errorMessage = "";
let searchErrorMessage = "";
let advertMessage = "";

const NORMAL_USER = 2;
const SUPER_USER = 0;
const MK_TEAM = 1;

const PACK = 0;
const STORY = 1;
const STICKER = "sticker";
const STORIES = "story";
const PACKS = "pack";
const PRODUCT = "product";

const PARSE_LIMIT = 2000;
const SPECIAL_CHARACTERS = /[`~!@#$%^&*()_|+\-=÷¿?;:'",.123<>\{\}\[\]\\\/]/gi;

//TODO investigate email template server url links
const PARSE_SERVER_URL = process.env.SERVER_URL;
const PARSE_PUBLIC_URL = process.env.SERVER_URL.replace('parse', 'public/');
const SERVER_URL = process.env.SERVER_URL.replace('parse', '');

let mailgun = new Mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});


let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// let databaseUri = config.DATABASE_URI; //for google

Parse.initialize(process.env.APP_ID);
Parse.serverURL = PARSE_SERVER_URL + '/';

/* for google
// Parse.initialize(config.APP_ID);
// Parse.serverURL = config.SERVER_URL;
*/

// console.log("DATABASE "+config.DATABASE_URI);

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
}


let api = new ParseServer({
    //**** General Settings ****//

    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    serverURL: PARSE_SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
    // serverURL: config.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed

    //**** Security Settings ****//
    allowClientClassCreation: process.env.CLIENT_CLASS_CREATION || false,

    appId: process.env.APP_ID || 'myAppId', //For heroku,
    //  clientKey: process.env.CLIENT_KEY || 'clientKey',
    // appId: config.APP_ID || 'myAppId', //For google

    masterKey: process.env.MASTER_KEY || 'myMasterKey', //Add your master key here. Keep it secret! //For heroku
    // masterKey: config.MASTER_KEY || 'myMasterKey', //For google

    // verbose: process.env.VERBOSE || true,
    verbose: process.env.VERBOSE || true,
    //**** Live Query ****//
    // liveQuery: {
    //     classNames: ["TestObject", "Place", "Team", "Player", "ChatMessage"] // List of classes to support for query subscriptions
    // },

    //**** Email Verification ****//
    /* Enable email verification */
    verifyUserEmails: true,
    /* The public URL of your app */
    // This will appear in the link that is used to verify email addresses and reset passwords.
    /* Set the mount path as it is in serverURL */
    publicServerURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
    /* This will appear in the subject and body of the emails that are sent */

    appName: process.env.APP_NAME || "Sticker Dashboard", //for heroku
    //appName: config.APP_NAME || 'Sticker Dashboard', // for google

    emailAdapter: {
        // module: 'parse-server-mailgun',
        module: 'parse-server-mailgun-adapter-template',

        options: {
            fromAddress: process.env.EMAIL_FROM || "test@example.com",
            domain: process.env.MAILGUN_DOMAIN || "example.com",
            apiKey: process.env.MAILGUN_API_KEY || "apikey",
            // Verification email subject
            verificationSubject: 'Please verify your e-mail for %appname%',
            // Verification email body
            // verificationBody: 'Hi,\n\nYou are being asked to confirm the e-mail address %email% with %appname%\n\nClick here to confirm it:\n%link%',
            //OPTIONAL (will send HTML version of email):
            verificationBodyHTML: fs.readFileSync("./verification/verification_email.html", "utf8") || null,

            // Password reset email subject
            passwordResetSubject: 'Password Reset Request for %appname%',
            // Password reset email body
            // passwordResetBody: 'Hi,\n\nYou requested a password reset for %appname%.\n\nClick here to reset it:\n%link%',
            //OPTIONAL (will send HTML version of email):
            passwordResetBodyHTML: fs.readFileSync("./verification/password_reset_email.html", "utf8") || null
        }
    },
    customPages: {
        invalidLink: PARSE_PUBLIC_URL + 'templates/invalid_link.html',
        verifyEmailSuccess: PARSE_PUBLIC_URL + 'templates/email_verified.html',
        choosePassword: PARSE_PUBLIC_URL + 'templates/choose_password.html',
        passwordResetSuccess: PARSE_PUBLIC_URL + 'templates/password_reset_success.html'
    },
    filesAdapter:
        new S3Adapter({
            bucket: "cyfa",
            directAccess: true
        })
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey


let app = express();

app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());   // Middleware for reading request body
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(methodOverride());

//TODO seperation of concerns
//app.use(require("./routes/newsletter"));

app.use('/', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    const schema = req.headers["x-forwarded-proto"];

    if (schema === "https") {
        req.connection.encrypted = true;
    }
    next();
});

app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    let schema = req.headers["x-forwarded-proto"];

    if (schema === "https") {
        req.connection.encrypted = true;
    }
    next();
});

app.all('/', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    let schema = req.headers["x-forwarded-proto"];

    if (schema === "https") {
        req.connection.encrypted = true;
    }
    next();
});

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
app.set('view engine', 'ejs');

// uploaded file storage location
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
let mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

const getUser = token => {

    return new Parse.Query('_Session')
        .equalTo('sessionToken', token)
        .include('user').first({sessionToken: token});
};


/*
how to use this function parseInstance.setACL(getACL(user,true|false));
* */
function setPermission(user, isPublicReadAccess) {
    let acl = new Parse.ACL(user);
    acl.setPublicReadAccess(isPublicReadAccess);
    return acl;
}


/*====================================== ACCOUNTS ============================*/

// Home Page
accountRoute(app);

/*====================================== ACCOUNTS ============================*/


/*====================================== ADVERTS ============================*/

advertRoute(app);

/*====================================== ADVERTS ============================*/


/*====================================== MESSAGES ============================*/


app.post('/message', function (req, res) {

    let token = req.cookies.token;
    let name = req.body.name;
    let email = req.body.email;
    let message = req.body.message;
    let source = parseInt(req.body.source);

    if (token) {

        getUser(token).then(function (sessionToken) {

            let Contact = new Parse.Object.extend(_class.Message);
            let contact = new Contact();

            contact.set("name", name);
            contact.set("email", email);
            contact.set("message", message);
            contact.set("type", source);
            contact.set("read", false);

            return contact.save();

        }).then(function () {

            res.redirect('/home');

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    }

});

app.get('/messages', function (req, res) {
    let token = req.cookies.token;
    let _messages = [];
    let _dates = [];
    let counter = 0;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Message).ascending().find();

        }).then(function (message) {

            _messages = message;

            _.each(message, function (date) {

                _dates[counter] = moment(date.get("createdAt")).format('LL');

                counter++;

            });

            res.render("pages/messages/messages", {
                contact: message,
                dates: _dates
            })

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    } else {
        res.redirect('/');

    }
});

app.get('/message/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Message).equalTo("objectId", id).first();

        }).then(function (message) {

            res.render("pages/messages/single_message", {
                message: message
            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/home');
        });
    } else {
        res.redirect('/');

    }

});

app.get('/message/send', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {

            res.render("pages/messages/post_message");

        }, function (error) {

            res.redirect('/home');

        })
    } else {

        res.redirect('/home');

    }
});


/*====================================== MESSAGES ============================*/

/*====================================== STORIES ============================*/
storyRoute(app);

/*====================================== STORIES ============================*/


/*====================================== BARCODE ============================*/

app.post('/barcode', function (req, res) {

    let token = req.cookies.token;
    let number = req.body.barcode_amount;
    let card_name = req.body.barcode_name;
    let barcodes = [];

    if (token) {

        getUser(token).then(function (sessionToken) {

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
        getUser(token).then(function (sessionToken) {

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

        getUser(token).then(function (sessionToken) {

            res.render("pages/barcodes/create_barcode");

        });
    } else {
        res.redirect('/');
    }

});


/*====================================== BARCODE ============================*/


/*====================================== CATEGORY ============================*/

categoryRoute(app);

/*====================================== CATEGORY ============================*/

/*====================================== REVIEWS ============================*/

reviewRoutes(app);

/*====================================== REVIEWS ============================*/


/*====================================== PACKS ============================*/

packRoutes(app);

/*====================================== PACKS ============================*/

app.get('/publish/:type/:status/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let status = req.params.status;
    let type = req.params.type;
    let pack = "/pack/";
    let storyEdit = "/storyedit/";
    let productEdit = "/product/";

    if (token) {

        getUser(token).then(function (sessionToken) {

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
                        res.redirect('/pack/create/previews/' + id);
                    } else if (status === "unpublish") {
                        res.redirect(pack + id);
                    }
                    return;

                case STORIES:
                    res.redirect(storyEdit + id);
                    return;

                case PRODUCT:
                    res.redirect(productEdit + id);
                    return;
            }

        }, function (error) {

            console.log("ERROR " + error.message);

            switch (type) {
                case PACKS:
                    res.redirect(pack + id);
                    return;

                case STORIES:
                    res.redirect(storyEdit + id);
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

/*====================================== STICKERS ============================*/

stickerRoute(app);

/*====================================== STICKERS ============================*/


/*====================================== PRODUCT ID ============================*/

productRoutes(app);

/*====================================== PRODUCT ID ============================*/


/*====================================== FEED ============================*/

feedRoutes(app);

/*====================================== FEED ============================*/

/*====================================== NEWSLETTER ============================*/
newsLetterRoute(app);

/*====================================== NEWSLETTER ============================*/

/*====================================== EXPERIMENTS ============================*/

app.get('/sendSMS', function (req, res) {
    let token = req.cookies.token;

    if (token) {
        getUser(token).then(function (sessionToken) {

            // let numbers = ['+233244504815', '+233241989305', '+447554517595', '+233274556209', '+233544215124', '+233242206380', '+233208266204'];
            let numbers = ['+233244504815'];
            let message = 'We are excited to introduce you to our newest App; CYFA. Get curated Ghanaian stickers & stories. Available on Android & iOS. https://cyfa.io ';

            _.each(numbers, function (number) {
                util.sendSMS(number, message, function () {

                });
            });

            res.send("FINISHED");
        })
    } else {
        res.rediect('/');
    }

});


app.get('/whatsapp', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {
            const accountSid = process.env.TWILIO_SID;
            const authToken = process.env.TWILIO_TOKEN;
            const client = require('twilio')(accountSid, authToken);

            client.messages
                .create({
                    from: 'whatsapp:+14155238886',
                    to: 'whatsapp:+233244504815',
                    body: 'Hello there!'
                })
                .then(message => console.log(JSON.stringify(message.sid)))
                .done();

            res.redirect('/');
        })
    } else {
        res.redirect('/');
    }
});


app.get("/feedbacks", function (req, res) {

    new Parse.Query("Feedback").descending("createdAt").find().then(function (feedbacks) {

        res.render("pages/feedback", {
            feedbacks: feedbacks
        });

    });
});

app.post("/feedback", function (req, res) {

    let name = req.body.name;
    let profession = req.body.profession;
    let email = req.body.email;
    let number = req.body.number;
    let media = req.body.media;

    let Feedback = new Parse.Object.extend("Feedback");
    let feedback = new Feedback();

    feedback.set("name", name);
    feedback.set("profession", profession);
    feedback.set("email", email);
    feedback.set("number", number);
    feedback.set("social", media);

    feedback.save().then(function (feedback) {
        res.redirect('/feedbacks');
    })

});

app.get("/test_nosql/:info", function (req, res) {

    let token = req.cookies.token;
    let info = req.params.info;

    if (token) {

        getUser(token).then(function (sessionToken) {

            res.send("RESULTS " + info);
        }, function (error) {
            res.send("ERROR " + error.message);
        })
    } else {
        res.redirect('/');
    }
});

// app.get("/fix_arrays", function (req, res) {
//
//     let token = req.cookies.token;
//     let _packs = [];
//
//     if (token) {
//
//         getUser(token).then(function (sessionToken) {
//
//             return new Parse.Query(_class.Packs).find();
//
//         }).then(function (packs) {
//
//             _.each(packs, function (pack) {
//                 console.log("PACK " + JSON.stringify(pack));
//
//                 pack.set("previews", []);
//                 _packs.push(pack);
//
//             });
//             return Parse.Object.saveAll(_packs);
//
//         }).then(function () {
//
//             console.log("SAVED ALL PACKS");
//             res.redirect('/');
//
//         })
//     } else {
//         res.redirect('/');
//     }
//
// });

app.get("/test_upload/:id", function (req, res) {
    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {
        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            res.render("pages/stickers/testupload", {id: pack.id, pack_name: pack.get("name")});

        })
    }
});

app.post('/upload_test', upload.array('im1[]'), function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.body.pack_id;
    let files = req.files;
    let fileDetails = [];
    let stickerDetails = [];
    let stickerCollection;
    let preview_file;

    let filePreviews = [];

    if (token) {
        thumbnail(files).then(previews => {
            console.log(JSON.stringify(previews));
            res.send(JSON.stringify(previews));
        });


    } else {

        res.redirect("/");

    }
});


app.get('/get_acl', function (req, res) {
    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {

            console.log("SESSION " + JSON.stringify(sessionToken));
            return new Parse.Query("Test").find({sessionToken: sessionToken.get("sessionToken")});

        }).then(function (test) {
            res.send("TEST RESULTS " + JSON.stringify(test));
        }, function (error) {
            res.send("TEST FAILED " + error.message);
        })
    }
});

app.get('/test_acl/:id/:text', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let text = req.params.text;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            let Test = new Parse.Object.extend("Test");
            let test = new Test();

            test.set("text_id", id);
            test.set("text", text);


            let ACL = new Parse.ACL();
            ACL.setReadAccess(_user.id, true);
            ACL.setWriteAccess(_user.id, true);
            ACL.setPublicReadAccess(true);


            test.setACL(ACL);

            return test.save();


        }).then(function (test) {

            res.send("TEST COMPLETE " + JSON.stringify(test));
        }, function (error) {
            res.send("TEST FAILED " + error.message);

        })

    }
});

app.get('/role', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            // var roleACL = new Parse.ACL();
            // roleACL.setPublicReadAccess(true);
            // var role = new Parse.Role("Administrator", roleACL);
            // role.getUsers().add(_user);
            //
            // return role.save();

            let queryRole = new Parse.Query(Parse.Role);
            queryRole.equalTo('name', 'Administrator');
            queryRole.first({
                success: function (admin) {
                    console.log("ADMIN " + JSON.stringify(admin));

                    let adminRelation = admin.Relation('_User');

                    adminRelation.add(_user);

                    return admin.save();
                },
                error: function (error) {
                    res.send("ROLE FAILED " + error.message);

                }
            });

            // var roleACL = new Parse.ACL();
            // roleACL.setPublicReadAccess(true);
            // var role = new Parse.Role("Administrator", roleACL);
            // role.save();

        }).then(function (admin) {
            res.send("ROLE COMPLETE " + JSON.stringify(admin));

        }, function (error) {
            res.send("ROLE FAILED " + error.message);

        })
    }
});
/*====================================== EXPERIMENTS ============================*/


let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
});
