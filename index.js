//main imports
require('sqreen');
let express = require('express');
let ejs = require('ejs');
let ParseServer = require('parse-server').ParseServer;
let Parse = require("parse/node").Parse; // import the module
let S3Adapter = require('@parse/s3-files-adapter');
const imageUpload = require('./upload.js')
let multer = require('multer');

//middleware for sessions and parsing forms
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
let cors = require('cors');
let methodOverride = require('method-override');

//for parsing location, directory and paths
let path = require('path');
let fs = require('fs');

// Access to all routes
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
let experimentRoutes = require('./routes/experiments');
let publishRoutes = require('./routes/publish');
let messageRoutes = require('./routes/messages');
let barcodeRoutes = require('./routes/barcodes');
let projectRoutes = require('./routes/projects');

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

//TODO investigate email template server url links
const PARSE_SERVER_URL = process.env.SERVER_URL;
const PARSE_PUBLIC_URL = process.env.SERVER_URL.replace('parse', 'public/');


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

let mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);


/*
how to use this function parseInstance.setACL(getACL(user,true|false));
* */
function setPermission(user, isPublicReadAccess) {
    let acl = new Parse.ACL(user);
    acl.setPublicReadAccess(isPublicReadAccess);
    return acl;
}

app.post('/upload', imageUpload);

/*====================================== ACCOUNTS ============================*/
accountRoute(app);
/*====================================== ACCOUNTS ============================*/


/*====================================== ADVERTS ============================*/
advertRoute(app);
/*====================================== ADVERTS ============================*/


/*====================================== MESSAGES ============================*/
messageRoutes(app);
/*====================================== MESSAGES ============================*/


/*====================================== STORIES ============================*/
storyRoute(app);
/*====================================== STORIES ============================*/


/*====================================== BARCODE ============================*/
barcodeRoutes(app);
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


/*====================================== PUBLISH ============================*/
publishRoutes(app);
/*====================================== PUBLISH ============================*/


/*====================================== STICKERS ============================*/
stickerRoute(app);
/*====================================== STICKERS ============================*/


/*====================================== PRODUCT ID ============================*/
productRoutes(app);
/*====================================== PRODUCT ID ============================*/

/*====================================== PRODUCT ID ============================*/
projectRoutes(app);
/*====================================== PRODUCT ID ============================*/


/*====================================== FEED ============================*/
feedRoutes(app);
/*====================================== FEED ============================*/


/*====================================== NEWSLETTER ============================*/
newsLetterRoute(app);
/*====================================== NEWSLETTER ============================*/


/*====================================== EXPERIMENTS ============================*/
experimentRoutes(app);
/*====================================== EXPERIMENTS ============================*/

app.get('/uploads/react/:id/:projectId', function (req, res) {

    let pack_id = req.params.id;
    let projectId = req.params.projectId;

    return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first()
    .then(function (pack) {
        res.render("pages/stickers/add_sticker", {
            id: pack.id,
            pack_name: pack.get("name")
          });
        }, function (error) {
            res.redirect("http://localhost:3000/pack/"+pack_id+"/"+projectId);
        })

});

app.post('/uploads/react', upload.array('im1[]'), function (req, res) {

    let pack_id = req.body.pack_id;
    let projectId = req.body.projectId;
    let files = req.files;
    let fileDetails = [];
    let stickerDetails = [];
    let stickerCollection = {};
    let _previews = [];
    let pack = "/pack/";

    // if (token) {
    //
    //     let _user = {};
    //
    //     util.getUser(token).then(function (sessionToken) {
    //
    //         _user = sessionToken.get("user");
    //         //TODO implement DRY for thumbnails
            util.thumbnail(files).then(previews => {

                _previews = previews;

                return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

            }).then(function (pack) {

                stickerCollection = pack;

                files.forEach(function (file) {

                    let Sticker = new Parse.Object.extend(_class.Stickers);
                    let sticker = new Sticker();


                    // fullName = fullName.replace(util.SPECIAL_CHARACTERS, '');
                    let originalName = file.originalname;
                    let stickerName = originalName.substring(0, originalName.length - 4).replace(util.SPECIAL_CHARACTERS, "");
                    console.log("FILE PATH ###" + file.path);
                    let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                    let bitmapPreview;
                    let parseFilePreview = "";

                    _.map(_previews, preview => {
                        if (stickerName === preview.name) {
                            bitmapPreview = fs.readFileSync(preview.path, {encoding: 'base64'});
                            parseFilePreview = new Parse.File(stickerName, {base64: bitmapPreview}, preview.mimetype);
                        }
                    });

                    //create our parse file
                    let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                    console.log("PARSE FILE " + JSON.stringify(parseFile));

                    sticker.set("name", stickerName);
                    sticker.set("localName", stickerName);
                    sticker.set("uri", parseFile);
                    sticker.set("preview", parseFilePreview);
                    // sticker.set("userId", _user.id);
                    sticker.set("parent", pack);
                    sticker.set("description", "");
                    sticker.set("meaning", "");
                    sticker.set("categories", []);
                    sticker.set("flagged", false);
                    sticker.set("archived", false);
                    if (pack.get("productId") !== "") {
                        sticker.set("sold", true);
                        sticker.set("productId", pack.get("productId"));
                    } else {
                        sticker.set("sold", false);
                        sticker.set("productId", "free");
                    }
                    sticker.set("version", pack.get("version"));

                    // sticker.setACL(setPermission(_user, false));

                    stickerDetails.push(sticker);
                    fileDetails.push(file);

                });

                console.log("SAVE ALL OBJECTS AND FILE");
                return Parse.Object.saveAll(stickerDetails);

            }).then(function (stickers) {

                _.each(fileDetails, function (file) {
                    //Delete tmp fil after upload
                    let tempFile = file.path;
                    fs.unlink(tempFile, function (err) {
                        if (err) {
                            //TODO handle error code
                            console.log("-------Could not del temp" + JSON.stringify(err));
                        }
                        else {
                            console.log("SUUCCCEESSSSS IN DELETING TEMP");
                        }
                    });
                });

                return new Parse.Query(_class.Stickers).equalTo("parent", {
                    __type: 'Pointer',
                    className: _class.Packs,
                    objectId: pack_id
                }).find();


                //console.log("SAVE COLLECTION RELATION");


            }).then(function (stickers) {

                // res.send("STICKERS " + stickers.length);

                _.each(stickers, function (sticker) {

                    let collection_relation = stickerCollection.relation(_class.Packs);
                    collection_relation.add(sticker);

                });

                // EMAIL PART

                // let data = {
                //     //Specify email data
                //     from: process.env.EMAIL_FROM || "test@example.com",
                //     //The email to contact
                //     to: _user.get("username"),
                //     //Subject and text data
                //     subject: 'Stickers Uploaded',
                //     html: fs.readFileSync("./uploads/sticker_upload.html", "utf8")
                // };
                //
                // mailgun.messages().send(data, function (error, body) {
                //     if (error) {
                //         console.log("BIG BIG ERROR: " + error.message);
                //     }
                //     else {
                //
                //         console.log("EMAIL SENT" + body);
                //     }
                // });

                return stickerCollection.save();

            }).then(function (stickers) {

                res.redirect("http://localhost:3000/pack/"+pack_id+"/"+projectId);

            }, function (error) {

                console.log("BIG BIG ERROR" + error.message);
                res.redirect("http://localhost:3000/pack/"+pack_id+"/"+projectId);

            });
        // }, function (error) {
        //     console.log("BIG BIG ERROR" + error.message);
        //     res.redirect("/");
        // });

    //
    // } else {
    //
    //     res.redirect("/");
    //
    // }
});


let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
});
