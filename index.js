//main imports
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
let admin = require('firebase-admin');

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

//google app engine configuration
//let config = require('./config.json');

//TODO create method to handle errors aka handleError
let errorMessage = "";
let searchErrorMessage = "";
let advertMessage = "";

const NORMAL_USER = 2;
const SUPER_USER = 0;
const MK_TEAM = 1;

const TEXT = 0;
const IMAGE = 1;
const QUOTE = 2;
const STICKER = 3;
const DIVIDER = 4;

const PACK = 0;
const STORY = 1;

const CATEGORY_LIMIT = 1000;

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
    // allowClientClassCreation: process.env.CLIENT_CLASS_CREATION || false,

    appId: process.env.APP_ID || 'myAppId', //For heroku,
    //  clientKey: process.env.CLIENT_KEY || 'clientKey',
    // appId: config.APP_ID || 'myAppId', //For google

    masterKey: process.env.MASTER_KEY || 'myMasterKey', //Add your master key here. Keep it secret! //For heroku
    // masterKey: config.MASTER_KEY || 'myMasterKey', //For google

    // verbose: process.env.VERBOSE || true,
    verbose: true,
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

//uploaded file storage location
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

let serviceAccount = require('./gstickers-e4668-firebase-adminsdk-s4jya-36f278f5f3.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gstickers-e4668.firebaseio.com"
});

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
app.get('/home', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        let _user = {};

        let _allPacks = [];
        let _story = [];
        let _collection = [];
        let _allAds = [];
        let _categories = [];
        let _messages = [];
        let sticker_id;
        let _latestSticker;
        let _storyImage;
        let _storyBody;
        let _stickerName;
        let _categoryLength = 0;
        let _packLength = 0;
        let _stickerLength = 0;
        let _storyLength = 0;
        const limit = 5;

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            if (_user.get("type") === MK_TEAM) {
                res.redirect('/get_barcode');
            }

            return Parse.Promise.when(
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first(),
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first(),
                new Parse.Query(_class.Packs).equalTo("user_id", _user.id).descending("createdAt").limit(limit).find(),
                new Parse.Query(_class.Categories).limit(limit).find(),
                new Parse.Query(_class.Stories).equalTo("user_id", _user.id).descending("createdAt").limit(limit).find(),
                new Parse.Query(_class.Packs).equalTo("user_id", _user.id).find(),
                new Parse.Query(_class.Categories).count(),
                new Parse.Query(_class.Packs).equalTo("user_id", _user.id).count(),
                new Parse.Query(_class.Stickers).equalTo("user_id", _user.id).count(),
                new Parse.Query(_class.Stories).equalTo("user_id", _user.id).count(),
                new Parse.Query(_class.Adverts).equalTo("user_id", _user.id).limit(limit).find(),
                new Parse.Query(_class.Message).limit(limit).find()
            );

        }).then(function (sticker, latestStory, collection, categories, story, allPacks, categoryLength, packLength,
                          stickerLength, storyLength, allAdverts, allMessages) {

            _categories = categories;
            _collection = collection;
            _story = story;
            _messages = allMessages;
            _allPacks = allPacks;
            _allAds = allAdverts;
            _categoryLength = helper.leadingZero(categoryLength);
            _packLength = helper.leadingZero(packLength);
            _stickerLength = helper.leadingZero(stickerLength);
            _storyLength = helper.leadingZero(storyLength);

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("latest_id")).first(),
                new Parse.Query(_class.ArtWork).equalTo("object_id", latestStory.get("latest_id")).first(),
                new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("latest_id")).first()
            );

        }).then(function (latestSticker, storyImage, storyBody) {

            _latestSticker = latestSticker.get("uri");
            _latestSticker['stickerName'] = latestSticker.get("stickerName");
            _latestSticker['description'] = latestSticker.get("description");

            _storyBody = storyBody;

            sticker_id = storyImage.get("sticker");

            return new Parse.Query(_class.Stickers).equalTo("objectId", sticker_id).first();

        }).then(function (sticker) {

            if (_user.get("type") === NORMAL_USER) {

                res.render("pages/home", {
                    collections: _collection,
                    allPacks: _allPacks,
                    story: _story,
                    categoryLength: _categoryLength,
                    packLength: _packLength,
                    stickerLength: _stickerLength,
                    storyLength: _storyLength,
                    name: _user.get("name"),
                    verified: _user.get("emailVerified"),
                    error_message: "null"

                });

            } else if (_user.get("type") === SUPER_USER) {

                res.render("pages/admin_home", {
                    collections: _collection,
                    categories: _categories,
                    allAdverts: _allAds,
                    allPacks: _allPacks,
                    story: _story,
                    latestSticker: _latestSticker,
                    latestStory: sticker,
                    storyBody: _storyBody,
                    stickerName: _stickerName,
                    messages: _messages,
                    categoryLength: _categoryLength,
                    packLength: _packLength,
                    stickerLength: _stickerLength,
                    storyLength: _storyLength,
                    user_name: _user.get("name"),
                    verified: _user.get("emailVerified"),
                    error_message: "null"

                });

            }

        }, function (error) {

            console.log("ERROR ON HOME " + error.message);

            res.render("pages/admin_home", {
                collections: _collection,
                categories: _categories,
                allAdverts: _allAds,
                allPacks: _allPacks,
                story: _story,
                categoryLength: _categoryLength,
                packLength: _packLength,
                stickerLength: _stickerLength,
                storyLength: _storyLength,
                user_name: _user.get("name"),
                verified: _user.get("emailVerified"),
                error_message: "null"
            });
        });


    } else {
        console.log("BACK TO LOGIN ");
        res.redirect("/");
    }
});

// Home Page
app.get('/', function (req, res) {

    let token = req.cookies.token;

    //utility render__ function to appending appId and serverURL
    const render__ = (_stickers, _error) => {
        res.render("pages/login",
            {
                stickers: _stickers,
                appId: process.env.APP_ID,
                serverURL: PARSE_SERVER_URL,
                error: _error
            });
    };

    if (token) {

        getUser(token).then(sessionToken => {

            _user = sessionToken.get("user");

            res.redirect("/home");

        });

    } else {

        return new Parse.Query(_class.Packs).equalTo("objectId", process.env.DEFAULT_PACK).first().then(function (pack) {

            if (pack) {

                console.log("PACK " + JSON.stringify(pack));

                let col = pack.relation(_class.Packs);
                return col.query().limit(40).find();

            } else {
                return []
            }

        }).then(function (stickers) {

            if (stickers.length) {

                console.log("STICKERS " + JSON.stringify(stickers));

                stickers = helper.shuffle(stickers);
                stickers = stickers.slice(0, 3);

                if (errorMessage === "") {
                    render__(stickers, []);

                } else {
                    render__(stickers, errorMessage);
                    // res.render("pages/login", {stickers: stickers, error: errorMessage});
                }

            } else {
                render__([], "");
            }

        }, function (error) {
            render__([], error.message)
        });

    }

})

app.get('/account/create', function (req, res) {
    let message = "";
    res.render("pages/sign_up", {error: message});
});


app.post('/account/user/update', upload.array('im1'), function (req, res) {

    let token = req.cookies.token;
    let email = req.body.email;
    let image = req.files;
    let type = parseInt(req.body.type);
    let handle = req.body.handles;
    let profile_info = [];
    let link_length = [];

    console.log("TYPE " + type + " HNDLE " + handle);


    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Profile).equalTo("user_id", _user.id).first();

        }).then(function (profile) {

            if (image) {
                image.forEach(function (file) {

                    console.log("FILE INFO " + file.path);

                    let fullName = file.originalname;

                    let image_name = fullName.substring(0, fullName.length - 4);

                    let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                    //create our parse file
                    let parseFile = new Parse.File(image_name, {base64: bitmap}, file.mimetype);

                    profile.set("uri", parseFile);
                    profile.set("email", email);
                    // sticker.setACL(setPermission(_user, false));

                    profile_info.push(profile);
                });
            } else {

                profile.set("email", email);
                return profile.save()

            }

            return Parse.Object.saveAll(profile_info);

        }).then(function (saved_profile) {

            if (profile_info.length) {
                _.each(profile_info, function (file) {
                    //Delete tmp fil after upload
                    let tempFile = file.path;
                    fs.unlink(tempFile, function (err) {
                        if (err) {
                            //TODO handle error code
                            console.log("-------Could not del temp" + JSON.stringify(err));
                        }
                        else {
                            console.log("SUUCCCEESSSSS IN DELTEING TEMP");
                        }
                    });
                });
            }
            return new Parse.Query(_class.Links).equalTo("object_id", _user.id).find();

        }).then(function (links) {

            if (type && handle) {
                if (links.length !== 0) {
                    _.each(links, function (_link) {

                        if (_link.get("type") === type) {

                            _link.set("link", handle);
                            link_length.push(1);

                            return _link.save();
                        }

                    });

                    if (link_length.length === 0) {

                        let Link = new Parse.Object.extend(_class.Links);
                        let link = new Link();

                        link.set("object_id", _user.id);
                        link.set("type", type);
                        link.set("link", handle);

                        return link.save();

                    }

                } else {
                    let Link = new Parse.Object.extend(_class.Links);
                    let link = new Link();

                    link.set("object_id", _user.id);
                    link.set("type", type);
                    link.set("link", handle);

                    return link.save();
                }


            } else {

                console.log("TYPE AND HANDLE NOT PRESENT");
                res.redirect('/account/user/profile');

            }

        }).then(function () {

            res.redirect('/account/user/profile');

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/account/user/profile');

        })
    } else {
        res.redirect('/');
    }
});


app.post('/signup', function (req, res) {
    let name = req.body.name;
    let username = req.body.username;
    let password = req.body.password;
    let gender = req.body.gender;

    let user = new Parse.User();
    user.set("name", name);
    user.set("username", username);
    user.set("password", password);
    user.set("type", NORMAL_USER);
    user.set("image_set", false);

    let Profile = new Parse.Object.extend(_class.Profile);
    let profile = new Profile();

    user.signUp({useMasterKey: true}, {
        success: function (user) {

            profile.set("user_id", user.id);
            profile.set("email", username);
            if (gender !== "undefined" || gender !== undefined) {
                profile.set("gender", gender);
            } else {
                profile.set("gender", "null");
            }

            profile.save().then(function () {

                res.redirect('/');

            });


        },
        error: function (user, error) {
            // Show the error message somewhere and let the user try again.
            let message = "SignUp was unsuccessful. " + error.message;
            console.log("SignUp was unsuccessful. " + JSON.stringify(error));
            res.render("pages/sign_up", {error: message});
        }
    });


});

app.get('/account/password/forgot', function (req, res) {
    res.render("pages/forgot_password");
});


app.post('/account/password/reset', function (req, res) {
    const username = req.body.forgotten_password;

    Parse.User.requestPasswordReset(username, {
        success: function () {
            // Password reset request was sent successfully
            console.log("EMAIL was sent successfully");
            res.render("pages/password_reset_info");
        },
        error: function (error) {
            // Show the error message somewhere
            console.log("Error: " + error.code + " " + error.message);
            res.redirect('/account/password/forgot');
        }
    });
});

app.get('/account/email/reset', function (req, res) {
    const token = req.cookies.token;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            new Parse.Query("User").equalTo("objectId", _user.id).first().then(function (user) {
                console.log("USER FROM RESET " + JSON.stringify(user) + " CURRENT USER " + Parse.User.current());
                user.set("email", "test@gmail.com");
                // user.set("username", "test@gmail.com");
                return user.save();
            }).then(function (result) {
                console.log("EMAIL CHANGED SUCCESSFULLY " + JSON.stringify(result));
                res.redirect("/");
            })
        }, function (error) {
            console.log("ERROR OCCURRED WHEN RESETTING EMAIL " + error.message)
        });

    } else {
        res.redirect('/');

    }

});


//login the user in using Parse
app.post('/login', function (req, res) {

    let username = req.body.username;
    let password = req.body.password;

    Parse.User.logIn(username, password).then(function (user) {

        console.log("SESSIONS TOKEN " + user.get('sessionToken'));
        res.cookie('token', user.get('sessionToken'));
        res.cookie('username', user.getUsername());
        res.cookie('userId', user.id);
        res.cookie('name', user.get("name"));
        res.cookie('email_verified', user.get("emailVerified"));
        res.cookie('userType', user.get("type"));

        var status = user.get("image_set");
        if (status === true) {
            res.cookie('profile_image', user.get("image").url());
        } else {
            res.cookie('profile_image', "null");
        }

        let userType = user.get("type");
        console.log("USER TYPE " + userType);

        // new Parse.Query('_Session')
        //     .equalTo('sessionToken', user.getSessionToken())
        //     .include('user').first().then(function (user) {
        //     console.log("SESSION DATA: "+JSON.stringify(user));
        // }, function (error) {
        //     console.log("SESSION DATA ERROR: "+JSON.stringify(error));
        // });
        // console.log("USER IMAGE "+req.cookies.profile);
        //    console.log("USER GETS TOKEN : " + user.getSessionToken());

        errorMessage = "";

        if (userType === NORMAL_USER) {
            res.redirect("/home");
        } else if (userType === SUPER_USER) {
            res.redirect("/admin_home");
        }


    }, function (error) {
        console.log("ERROR WHEN LOGGIN IN " + error);
        errorMessage = error.message;
        res.redirect("/");

    });
});

app.get('/account/user/profile', function (req, res) {

    let token = req.cookies.token;
    let _user = {};
    let _profile = {};

    if (token) {

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Profile).equalTo("user_id", _user.id).first();

        }).then(function (profile) {

            _profile = profile;

            return new Parse.Query(_class.Links).equalTo("object_id", profile.get("user_id")).find();

        }).then(function (links) {

            res.render("pages/profile", {
                username: _user.get("name"),
                email: _user.get("username"),
                profile: _profile,
                links: links
            });

        }, function (error) {
            console.log("ERROR ON PROFILE " + error.message);
            res.redirect('/');
        });

    } else {
        res.redirect('/');
    }
});

//LOGOUT
app.get('/account/logout', function (req, res) {
    res.clearCookie('token');
    res.redirect("/");
});
/*====================================== ACCOUNTS ============================*/


/*====================================== ADVERTS ============================*/


app.get('/adverts', function (req, res) {

    let token = req.cookies.token;
    let _adverts = [];
    let _user = {};

    if (token) {

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Adverts).equalTo("user_id", _user.id).find(),
                new Parse.Query(_class.AdvertImages).find(),
            );

        }).then(function (adverts, ad_images) {

            _.each(adverts, function (advert) {

                _.each(ad_images, function (image) {

                    if (advert.id === image.get("advert_id")) {

                        //TODO modify query to group types
                        //TODO use type constants from types JS e.g type.LINKS.android
                        if (image.get("type") === 0) {
                            _adverts.push({
                                advert: advert,
                                image: image.get("uri").url()
                            })
                        }
                    }

                });
            });

            let spliced = [];
            for (let i = 0; i < adverts.length; i = i + 1) {

                console.log("ADVERTS " + JSON.stringify(adverts[i]));

                for (let j = 0; j < _adverts.length; j = j + 1) {

                    if (adverts[i].get("title") === _adverts[j].advert.get("title")) {
                        console.log("SPLICED ITEM " + JSON.stringify(adverts[i]));

                        adverts.splice(i, 1);
                        spliced.push(i);
                        console.log("SPLICED************");
                    }
                }
            }

            advertMessage = "";

            res.render("pages/advert_collection", {
                adverts: _adverts,
                _adverts: adverts,
            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    } else {

        res.redirect('/');

    }
});

app.get('/advert/edit/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(_class.Adverts).equalTo("objectId", id).first(),
                new Parse.Query(_class.AdvertImages).equalTo("advert_id", id).first()
            );

        }).then(function (advert, advertImage) {

            res.render("pages/advert_details", {

                ad_details: advert,
                ad_images: advertImage,
                advertMessage: advertMessage
            })

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })

    } else {

        res.redirect('/');

    }
});


app.post('/update/advert/link/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let type = parseInt(req.body.type);
    let link = req.body.link;
    let existing = [];

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Links).equalTo("object_id", id).find();

        }).then(function (links) {

            _.each(links, function (link) {
                if (link.get("type") === type) {
                    existing.push(type);
                }
            });

            if (existing.length > 0) {

                res.redirect('/advert/edit/' + id);

            } else {

                let Links = new Parse.Object.extend(_class.Links);
                let links = new Links();

                links.set("type", type);
                links.set("object_id", id);
                links.set("link", link);

                return links.save();
            }

        }).then(function (link) {

            res.redirect('/advert/edit/' + id);


        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/advert/edit/' + id);

        })
    } else {

        res.redirect('/');

    }
});

app.post('/advert/image/:id', upload.array('adverts'), function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let files = req.files;
    let fileDetails = [];
    let advertDetails = [];

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.AdvertImages).equalTo("advert_id", id).first();

        }).then(function (advert) {

            if (advert) {
                // advertMessage = "ADVERT under category already exist";
                res.redirect('/advert/edit/' + id);
            } else {
                files.forEach(function (file) {

                    let fullName = file.originalname;
                    let image_name = fullName.substring(0, fullName.length - 4);

                    let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                    //create our parse file
                    let parseFile = new Parse.File(image_name, {base64: bitmap}, file.mimetype);
                    console.log("PARSEFILE " + JSON.stringify(parseFile));

                    let Advert_Image = new Parse.Object.extend(_class.AdvertImages);
                    let advert_image = new Advert_Image();

                    advert_image.set("name", image_name);
                    advert_image.set("advert_id", id);
                    advert_image.set("uri", parseFile);

                    advertDetails.push(advert_image);
                    fileDetails.push(file);

                });

                advertMessage = "";

                return Parse.Object.saveAll(advertDetails);
            }

        }).then(function () {

            if (fileDetails.length) {
                _.each(fileDetails, function (file) {
                    //Delete tmp fil after upload
                    var tempFile = file.path;
                    fs.unlink(tempFile, function (error) {
                        if (error) {
                            //TODO handle error code
                            //TODO add job to do deletion of tempFiles
                            console.log("-------Could not del temp" + JSON.stringify(error));
                        }
                        else {
                            console.log("-------Deleted All Files");

                        }
                    });
                });
            }

            res.redirect('/advert/edit/' + id);


        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/advert/edit/' + id);

        })

    } else {
        res.redirect('/');
    }


});

app.post('/advert/edit/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let title = req.body.title;
    let description = req.body.description;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Adverts).equalTo("objectId", id).first();

        }).then(function (advert) {

            advert.set("title", title);
            advert.set("description", description);

            return advert.save();

        }).then(function () {

            advertMessage = "";
            res.redirect('/advert/edit/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/advert/edit/' + id);

        })
    } else {

        res.redirect('/');

    }

});

app.post('/advert', function (req, res) {

    let token = req.cookies.token;
    let title = req.body.title;
    let description = req.body.description;
    let action = req.body.action;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let Advert = new Parse.Object.extend(_class.Adverts);
            let advert = new Advert();

            advert.set("title", title);
            advert.set("description", description);
            advert.set("user_id", _user.id);
            advert.set("buttonAction", action);

            return advert.save();

        }).then(function (advert) {

            advertMessage = "";
            res.redirect('/advert/edit/' + advert.id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        });
    } else {
        res.redirect('/');

    }

});

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

            res.render("pages/messages", {
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

            res.render("pages/single_message", {
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

            res.render("pages/post_message");

        }, function (error) {

            res.redirect('/home');

        })
    } else {

        res.redirect('/home');

    }
});


/*====================================== MESSAGES ============================*/

/*====================================== STORIES ============================*/

app.get('/stories', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        let _user = {};
        let art = {};
        let _story = [];
        let _allPack = [];
        let artWork = [];
        let _allArtwork = [];
        let combined = [];
        let _latest;

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Stories).equalTo("user_id", _user.id).descending("createdAt").find(),
                new Parse.Query(_class.Packs).equalTo("user_id", _user.id).find(),
                new Parse.Query(_class.ArtWork).find(),
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first()
            );


        }).then(function (story, allPack, artworks, latest) {

            _story = story;
            _allPack = allPack;
            _allArtwork = artworks;
            _latest = latest;

            _.each(artworks, function (artwork) {

                artWork.push(artwork.get("sticker"));

            });

            return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find();

        }).then(function (stickers) {

            _.each(_allArtwork, function (artworks) {

                _.each(stickers, function (sticker) {

                    if (artworks.get("sticker") === sticker.id) {

                        combined.push({
                            story: artworks.get("object_id"),
                            image: sticker.get("uri").url()
                        });
                    }
                })
            });

            res.render("pages/stories", {
                story: _story,
                allPacks: _allPack,
                arts: combined,
                latest: _latest
            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    } else {
        res.redirect('/');

    }
});

app.get('/storyitem/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    console.log("STORY ID " + id);

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stories).equalTo("objectId", id).first()

        }).then(function (story) {

            res.render("pages/story_catalogue", {

                story_id: story.id,
                name: story.get("title")

            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/stories');
        });
    } else {
        console.log("COMING HOME");
        res.redirect('/');

    }
});

app.get('/storyitem/view/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let image_array = [];
    let sticker_array = [];
    let _storyItem;
    let _images = [];
    let _stickers = [];

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("story_id", id).find();

        }).then(function (story_item) {

            _storyItem = story_item;

            _.each(story_item, function (item) {
                if (item.get("type") === type.STORY_ITEM.image) {
                    image_array.push(item.get("content"));
                } else if (item.get("type") === type.STORY_ITEM.sticker) {
                    sticker_array.push(item.get("content"));
                }
            });

            if (image_array.length > 0) {
                return new Parse.Query(_class.Assets).containedIn("objectId", image_array).find();

            } else {
                return true;
            }

        }).then(function (image) {

            if (image.length > 0) {
                _images = image;
            }


            if (sticker_array.length > 0) {
                return new Parse.Query(_class.Stickers).containedIn("objectId", sticker_array).find();

            } else {
                return true;
            }

        }).then(function (stickers) {

            if (stickers) {

                _stickers = stickers;

            }

            res.render("pages/story_items", {

                story_item: _storyItem,
                story_id: id,
                stickers: _stickers,
                images: _images

            });
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyedit/' + id)
        })
    }
});

app.post('/storyitem/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let content = req.body.content;
    let story_id = req.body.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (story_item) {

            story_item.set("content", content);
            return story_item.save();

        }).then(function () {

            res.redirect('/storyitem/view/' + story_id);

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/storyitem/edit/' + id + "/" + story_id);
        })
    } else {
        res.redirect('/');
    }
});

app.post('/storyitem/sticker/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        let _user = {};
        let _story = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

        }).then(function (story) {

            _story = story;

            return new Parse.Query(_class.Packs).equalTo("objectId", story.get("pack_id")).first();

        }).then(function (pack) {

            let col = pack.relation(_class.Packs);
            return col.query().find();

        }).then(function (stickers) {

            res.render("pages/catalogue_sticker", {
                story: _story.id,
                stickers: stickers
            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/');

        });
    } else {
        res.redirect('/');

    }
});

app.post('/storyitem/sticker/add/:id', function (req, res) {

    let token = req.cookies.token;
    let sticker_id = req.body.sticker_id;
    let story_id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {
            let Story = new Parse.Object.extend(_class.StoryItems);
            let catalogue = new Story();

            catalogue.set("content", sticker_id);
            catalogue.set("story_id", story_id);
            catalogue.set("type", type.STORY_ITEM.sticker);

            return catalogue.save();

        }).then(function () {

            res.redirect('/storyitem/' + story_id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyedit/' + story_id);

        })
    } else {
        res.redirect('/');

    }
});

app.post('/storyItem/image/:id', upload.array('im1'), function (req, res) {

    let token = req.cookies.token;
    let files = req.files;
    let id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            let Asset = new Parse.Object.extend(_class.Assets);
            let asset = new Asset();

            let fullName = files[0].originalname;
            let stickerName = fullName.substring(0, fullName.length - 4);

            let bitmap = fs.readFileSync(files[0].path, {encoding: 'base64'});

            //create our parse file
            let parseFile = new Parse.File(stickerName, {base64: bitmap}, files[0].mimetype);

            asset.set("uri", parseFile);

            return asset.save();

        }).then(function (image) {

            let Story = new Parse.Object.extend(_class.StoryItems);
            let catalogue = new Story();

            catalogue.set("type", type.STORY_ITEM.image);
            catalogue.set("content", image.id);
            catalogue.set("story_id", id);

            return catalogue.save();

        }).then(function () {

            //Delete tmp fil after upload
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


            res.redirect("/storyitem/" + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect("/storyitem/" + id);

        })
    } else {
        res.redirect('/');

    }
});

app.post('/storyItem/type/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let content = req.body.content;
    let _type = parseInt(req.body.style);

    if (token) {

        console.log("CONTENT " + content);

        getUser(token).then(function (sessionToken) {

            let Story = new Parse.Object.extend(_class.StoryItems);
            let story = new Story();

            switch (_type) {
                case type.STORY_ITEM.text:
                    story.set("type", type.STORY_ITEM.text);
                    break;

                case type.STORY_ITEM.quote:
                    story.set("type", type.STORY_ITEM.quote);
                    break;

                case type.STORY_ITEM.divider:
                    story.set("type", type.STORY_ITEM.divider);
                    break;

                case type.STORY_ITEM.italic:
                    story.set("type", type.STORY_ITEM.italic);
                    break;

                case type.STORY_ITEM.bold:
                    story.set("type", type.STORY_ITEM.bold);
                    break;

                case type.STORY_ITEM.italicBold:
                    story.set("type", type.STORY_ITEM.italicBold);
                    break;
            }

            story.set("content", content);
            story.set("story_id", id);

            return story.save();

        }).then(function () {

            res.redirect("/storyitem/" + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect("/storyedit/" + id);
        })
    } else {
        res.redirect('/');

    }
});

app.post('/story/artwork/add/:id/:state', function (req, res) {
    let token = req.cookies.token;
    let sticker_id = req.body.sticker_id;
    let story_id = req.params.id;
    let state = req.params.state;

    if (token) {

        let _user = {};
        let id;

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stories).equalTo("objectId", story_id).first();

        }).then(function (story) {
            id = story.id;

            if (state === "change") {

                return new Parse.Query(_class.ArtWork).equalTo("object_id", story.id).first();

            } else if (state === "new") {
                let Artwork = new Parse.Object.extend(_class.ArtWork);
                let artwork = new Artwork();

                artwork.set("object_id", id);
                artwork.set("sticker", sticker_id);

                return artwork.save();
            }


        }).then(function (artwork) {

            if (state === "change") {

                artwork.set("sticker", sticker_id);

                return artwork.save();

            } else if (state === "new") {
                res.redirect('/storyedit/' + id);

            }

        }).then(function () {

            res.redirect('/storyedit/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/story/' + story_id + '/' + state);

        });
    } else {
        res.redirect('/');

    }
});

app.get('/story/artwork/:state/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let state = req.params.state;

    if (token) {

        let _user = {};
        let _story = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

        }).then(function (story) {

            _story = story;

            return new Parse.Query(_class.Packs).equalTo("objectId", story.get("pack_id")).first();

        }).then(function (pack) {

            let col = pack.relation(_class.Packs);
            return col.query().find();

        }).then(function (stickers) {

            res.render("pages/story_artwork", {
                story: _story.id,
                stickers: stickers,
                state: state
            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/');

        });
    } else {
        res.redirect('/');

    }
});

app.get('/storyedit/:id', function (req, res) {

    let token = req.cookies.token;
    let story_id = req.params.id;
    let _latest;
    let page;

    if (token) {

        let _user = {};
        let _story = {};
        let colors = [];

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(_class.Stories).equalTo("objectId", story_id).first(),
                new Parse.Query(_class.ArtWork).equalTo("object_id", story_id).first(),
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first(),
                new Parse.Query(_class.Stories).find()
            );

        }).then(function (story, sticker, latest, stories) {

            _story = story;
            _latest = latest;

            page = util.page(stories, story_id);

            console.log("PAGE " + JSON.stringify(page));

            colors = story.get("color");
            if (colors) {
                colors = story.get("color");
            } else {
                //use system default
                colors = type.DEFAULT.color;
            }

            return new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("sticker")).first();


        }).then(function (_sticker) {

            res.render("pages/story_details", {
                story: _story,
                sticker: _sticker,
                colors: colors,
                latest: _latest,
                next: page.next,
                previous: page.previous
            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/stories');
        })

    } else {

        res.redirect('/');

    }
});

app.post('/storyedit/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let title = req.body.title;
    let keyword = req.body.keyword;
    let summary = req.body.summary;
    let _keyword = [];

    if (keyword !== "undefined" || keyword !== undefined) {
        _keyword = keyword.split(",");
    }

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {
            _user = sessionToken.get("user");

            return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

        }).then(function (story) {

            story.set("title", title);
            story.set("keyword", _keyword);
            story.set("summary", summary);

            return story.save();

        }).then(function () {

            res.redirect('/storyedit/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyedit/' + id);

        })
    } else {
        res.redirect('/');

    }
});

app.post('/story', function (req, res) {
    let token = req.cookies.token;
    let title = req.body.title;
    let summary = req.body.summary;
    let pack_id = req.body.pack_id;
    let body = req.body.story;
    let keywords = req.body.keyword;
    let _keywords = [];
    let story_id = "";
    let state = "new";

    if (keywords !== undefined || keywords !== "undefined") {
        _keywords = keywords.split(",");
    }

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let Stories = new Parse.Object.extend(_class.Stories);
            let story = new Stories();

            story.set("title", title);
            story.set("summary", summary);
            story.set("pack_id", pack_id);
            story.set("keyword", _keywords);
            // story.set("is_latest_story", false);
            story.set("published", false);
            story.set("user_id", _user.id);
            story.set("status", 0);

            return story.save();

        }).then(function (story) {
            let Main = new Parse.Object.extend(_class.StoryBody);
            let main = new Main();

            story_id = story.id;
            main.set("story_id", story.id);
            main.set("story", body);

            return main.save();

        }).then(function () {

            res.redirect('/story/' + story_id + '/' + state);

        }, function (error) {
            console.log("ERROR WHEN CREATING NEW STORY " + error.message);
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }

});

app.get('/storycolor/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let color = [];
    let _story = [];

    if (token) {

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(_class.Stories).equalTo("objectId", id).first(),
                new Parse.Query(_class.ArtWork).equalTo("object_id", id).first()
            );

        }).then(function (story, art) {

            console.log("ART " + JSON.stringify(art));
            _story = story;
            colors = story.get("color");
            if (colors) {
                color = story.get("color");
            } else {
                //use system default
                colors = type.DEFAULT.color
            }

            return new Parse.Query(_class.Stickers).equalTo("objectId", art.get("sticker")).first();

        }).then(function (sticker) {

            res.render("pages/choose_color", {
                story: _story,
                colors: colors,
                sticker: sticker
            });
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyedit/' + story.id);
        })

    } else {
        res.redirect('/');

    }
});

app.post('/story/color/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let color_1 = req.body.color1;
    let color_2 = req.body.color2;
    let hash = "#";

    if (token) {

        color_1 = hash.concat(color_1);
        color_2 = hash.concat(color_2);

        console.log("COLOR " + color_2);

        let colors = [color_1, color_2];

        let _user = {};

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stories).equalTo("objectId", id).first();


        }).then(function (story) {

            story.set("color", colors);

            return story.save();

        }).then(function () {

            res.redirect('/storyedit/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyedit/' + id);

        });

    } else {
        res.redirect('/');

    }
});

app.get('/storymain/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(_class.StoryBody).equalTo("story_id", id).first(),
                new Parse.Query(_class.Stories).equalTo("objectId", id).first()
            )

        }).then(function (storyBody, story) {

            res.render("pages/story_page", {
                story: storyBody,
                title: story.get("title")
            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/storyedit/' + id);
        });
    } else {
        res.redirect('/');

    }
});

app.post('/storymain/edit/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let main_story = req.body.main_story;
    let story_id = "";

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.StoryBody).equalTo("objectId", id).first();
        }).then(function (story) {

            story_id = story.get("story_id");

            story.set("story", main_story);

            return story.save();

        }).then(function () {

            res.redirect('/storymain/' + story_id);

        }, function (error) {

            console.log("ERROR " + error.message)
            res.redirect('/storymain/' + story_id);
        })
    } else {
        res.redirect('/');

    }
});

app.get('/storydelete/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let _user = {};

    if (token) {

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            console.log("STORY ID " + id);
            return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

        }).then(function (story) {

            story.destroy({
                success: function (object) {
                    console.log("removed" + JSON.stringify(object));
                    res.redirect('/stories');
                },
                error: function (error) {
                    console.log("Could not remove" + error);
                    res.redirect("/stories");

                }
            });

        }, function (error) {

            console.log("ERROR " + error);
            res.redirect("/stories");

        })
    } else {
        res.redirect('/');
    }
});

app.post('/storyitem/delete/:storyId', function (req, res) {
    let token = req.cookies.token;
    let id = req.body.storyItem;
    let storyId = req.params.storyId;
    let assetId;
    let _storyItem;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (storyItem) {

            assetId = storyItem.get("content");
            _storyItem = storyItem;

            storyItem.destroy({
                success: function (object) {
                    console.log("removed" + JSON.stringify(object));
                    return true;
                },
                error: function (error) {
                    console.log("Could not remove" + error);
                    res.redirect("/storyitem/view/" + storyId);

                }
            })

        }).then(function () {

            if (_storyItem.get("type") === type.STORY_ITEM.image) {

                return new Parse.Query(_class.Assets).equalTo("objectId", assetId).first();

            } else {

                res.redirect("/storyitem/view/" + storyId);

            }

        }).then(function (asset) {

            asset.destroy({
                success: function (object) {
                    console.log("removed" + JSON.stringify(object));
                    res.redirect("/storyitem/view/" + storyId);
                },
                error: function (error) {
                    console.log("Could not remove" + error);
                    res.redirect("/storyitem/view/" + storyId);

                }
            })

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/stories');
        })

    } else {
        res.redirect('/');
    }

});

app.get('/storyitem/delete/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        console.log("THIS IS THE CORRECT ROUTE");
        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("story_id", id).find();

        }).then(function (stories) {

            console.log("THIS IS THE CORRECT ROUTE 2 " + JSON.stringify(stories));

            if (stories.length > 0) {

                return Parse.Object.destroyAll(stories);

            } else {

                return true;

            }

        }).then(function (success) {

            console.log("THIS IS THE CORRECT ROUTE 3");


            res.redirect("/storydelete/" + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/stories');
        })

    } else {
        res.redirect('/');
    }
});

app.post('/storyitem/change/:storyId', upload.array('im1'), function (req, res) {

    let token = req.cookies.token;
    let files = req.files;
    let id = req.body.storyItemId;
    let storyId = req.params.storyId;
    let previousForm = parseInt(req.body.previousContent);
    let storyItemType = parseInt(req.body.storyItemType);
    let content = req.body.text_element;
    let _storyItem = [];
    let storyContent;
    let _storyId;

    console.log("TYPE " + storyItemType);

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (storyItem) {

            _storyItem = storyItem;
            storyContent = storyItem.get("content");
            _storyId = storyItem.get("story_id");

            if (storyItemType === type.STORY_ITEM.text || storyItemType === type.STORY_ITEM.quote ||
                storyItemType === type.STORY_ITEM.bold || storyItemType === type.STORY_ITEM.italic ||
                storyItemType === type.STORY_ITEM.italicBold) {

                storyItem.set("type", storyItemType);
                storyItem.set("content", content);

                return storyItem.save();
            } else if (storyItemType === type.STORY_ITEM.divider) {

                storyItem.set("type", storyItemType);
                storyItem.set("content", "");

                return storyItem.save();
            } else if (storyItemType === type.STORY_ITEM.image) {

                if (files) {
                    let Asset = new Parse.Object.extend(_class.Assets);
                    let asset = new Asset();

                    let fullName = files[0].originalname;
                    let stickerName = fullName.substring(0, fullName.length - 4);

                    let bitmap = fs.readFileSync(files[0].path, {encoding: 'base64'});

                    let parseFile = new Parse.File(stickerName, {base64: bitmap}, files[0].mimetype);

                    asset.set("uri", parseFile);

                    return asset.save();
                }
            } else if (storyItemType === type.STORY_ITEM.sticker) {
                res.redirect('/storyitem/change/sticker/' + _storyId + '/' + id);
            }
        }).then(function (asset) {

            if (storyItemType === type.STORY_ITEM.image) {
                _storyItem.set("type", storyItemType);
                _storyItem.set("content", asset.id);

                return _storyItem.save();

            } else {

                return true;

            }
        }).then(function () {

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

            if (previousForm === type.STORY_ITEM.image) {

                console.log("INSIDE IMAGE" + storyContent + " STORY " + _storyItem.get("content"));
                return new Parse.Query(_class.Assets).equalTo("objectId", storyContent).first();

            } else {
                res.redirect('/storyitem/view/' + storyId);

            }

        }).then(function (image) {

            console.log("IMAGE FROM ASSETS " + JSON.stringify(image));


            image.destroy({
                success: function (object) {
                    console.log("DESTROYED IAMGE " + JSON.stringify(object));
                    res.redirect('/storyitem/view/' + storyId);
                },
                error: function (error) {
                    console.log("Could not remove" + error);
                    res.redirect('/storyitem/view/' + storyId);

                }
            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyitem/view/' + storyId);

        })

    } else {
        res.redirect('/');
    }

});

app.post('/storyitem/change/sticker/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let stickerId = req.body.sticker_id;
    let storyId;

    if (token) {

        getUser(token).then(function (sessionToken) {

            console.log(" STORYITEM 2 " + id);

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (storyItem) {

            storyId = storyItem.get("story_id");

            storyItem.set("type", type.STORY_ITEM.sticker);
            storyItem.set("content", stickerId);

            return storyItem.save();

        }).then(function () {

            res.redirect('/storyitem/view/' + storyId);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyitem/view/' + storyId);

        })
    } else {
        res.redirect('/');
    }

});

app.get('/storyitem/change/sticker/:storyId/:storyItemId', function (req, res) {

    let token = req.cookies.token;
    let storyId = req.params.storyId;
    let storyItemId = req.params.storyItemId;

    if (token) {

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            console.log("STORY ID " + storyId + " STORYITEM " + storyItemId);

            return new Parse.Query(_class.Stories).equalTo("objectId", storyId).first();

        }).then(function (story) {

            return new Parse.Query(_class.Packs).equalTo("objectId", story.get("pack_id")).first();

        }).then(function (pack) {

            let col = pack.relation(_class.Packs);
            return col.query().find();

        }).then(function (stickers) {

            res.render("pages/change_catalogue_sticker", {
                storyItemId: storyItemId,
                stickers: stickers
            });

        }, function () {

        })
    }
});

app.get('/storyitem/edit/:id/:story_id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let story_id = req.params.story_id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (story_item) {

            res.render("pages/edit_story_item", {
                story_item: story_item,
                story_id: story_id
            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/story/item/' + story_id);
        })
    } else {
        res.redirect('/');
    }

});

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
                    res.render("pages/get_barcode", {
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

            res.render("pages/create_barcode");

        });
    } else {
        res.redirect('/');
    }

});


/*====================================== BARCODE ============================*/


/*====================================== CATEGORY ============================*/
// FIND A SPECIFIC CATEGORY
app.post('/category/find', function (req, res) {

    let token = req.cookies.token;
    let categoryName = req.body.searchCategory;

    if (token) {

        let searchCategory = new Parse.Query(_class.Categories);
        searchCategory.equalTo("name", categoryName);
        searchCategory.first().then(function (category) {

                if (category) {
                    console.log("MESSAGE FROM SEARCH " + category);
                    console.log("CATEGORY DETAILS " + JSON.stringify(category));
                    res.render("pages/search_categories", {categories: category});
                } else {
                    console.log("MESSAGE FROM SEARCH " + category);
                    console.log("CATEGORY DETAILS " + JSON.stringify(category));
                    res.render("pages/search_categories", {categories: []});
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


//SELECT CATEGORIES PAGE
app.get('/categories', function (req, res) {
    let token = req.cookies.token;

    if (token) {

        new Parse.Query(_class.Categories).limit(CATEGORY_LIMIT).ascending().find().then(function (categories) {

                let _categories = helper.chunks(categories, 4);

                res.render("pages/categories", {categories: _categories});
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

        getUser(token).then(function (sessionToken) {

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

        getUser(token).then(function (sessionToken) {

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

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Categories).equalTo("objectId", id).first();

        }).then(function (category) {
                category.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        res.redirect("/categories");
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                        res.redirect("/categories");

                    }
                });
            },
            function (error) {
                console.log("ERROR " + error);
                res.redirect("/categories");

            });
    }
    else { //no session found
        res.redirect("/");
    }

});

/*====================================== CATEGORY ============================*/

/*====================================== REVIEWS ============================*/

app.get('/reviews', function (req, res) {

    let token = req.cookies.token;

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Reviews).equalTo('owner', _user.id).find(); // Set our channel

        }).then(function (review) {
            // res.send(JSON.stringify(review));
            res.render("pages/review_collection", {reviews: review});

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');

        });
    } else {
        res.redirect('/');

    }
});

app.get('/review/:id', function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs);

        }).then(function (pack) {

            pack.get(pack_id, {
                success: function (pack) {
                    let pack_name = pack.get("pack_name");
                    let pack_owner = pack.get("user_name");
                    let pack_owner_id = pack.get("user_id");
                    let art = pack.get("art_work");
                    let pack_id = pack.id;
                    let _description = pack.get("pack_description");

                    //
                    // new Parse.Query("User").equalTo("objectId", pack_owner).find().then(function (user) {
                    //     _owner = user;
                    //     console.log("ABOUT TO SEARCH FOR USER "+JSON.stringify(_owner));
                    // }, function (error) {
                    //     console.log("ERROR "+error.message);
                    // });

                    res.render("pages/review_page", {
                        id: pack_id,
                        packName: pack_name,
                        owner: pack_owner,
                        art_work: art,
                        owner_id: pack_owner_id,
                        description: _description
                    });
                },
                error: function (error) {
                    console.log("ERROR " + error.message);
                    res.redirect('/packs');
                }

            });
        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/packs');
        });
    } else {
        res.redirect('/');
    }
});

app.post('/review/pack/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let comment = req.body.review_text;
    let status = req.body.approved;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let Reviews = new Parse.Object.extend("Reviews");
            let review = new Reviews();

            new Parse.Query(_class.Packs).equalTo("objectId", id).first().then(function (pack) {
                console.log("PACK FROM REVIEW " + JSON.stringify(pack));
                if (status === "2") {
                    pack.set("status", type.PACK_STATUS.approved);
                } else if (status === "1") {
                    pack.set("status", type.PACK_STATUS.rejected);
                }
                review.set("image", pack.get("art_work").url());
                review.set("name", pack.get("pack_name"));
                review.set("owner", pack.get("user_id"));
                review.set("pack_id", pack.id);
                return pack.save();

            }).then(function () {

                if (status === "2") {
                    review.set("approved", true);
                } else if (status === "1") {
                    review.set("approved", false);
                }
                review.set("comments", comment);
                review.set("reviewer", _user.id);
                review.set("reviewer_name", _user.get("name"));
                review.set("type_id", id);
                review.set("review_field", []);
                review.set("type", 0);

                return review.save();
            }).then(function () {
                console.log("PACK WAS SUCCESSFULLY REVIEWED");
                res.redirect('/pack/' + id);
            });
        }, function (error) {
            console.log("ERROR OCCURRED WHEN REVIEWING " + error.message);
            res.redirect('/review/' + id);
        });
    } else {
        res.redirect('/');

    }
});

app.get('/review/edit/:id', function (req, res) {

    let token = req.cookies.token;
    let review_id = req.params.id;

    if (token) {

        let _user = {};
        let _review = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Reviews).equalTo("objectId", review_id).first();

        }).then(function (review) {
            _review = review;

            console.log("REVIEWS " + JSON.stringify(review));
            let type = review.get("type");
            if (type === 1) {
                let id = review.get("type_id");
                return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();
            } else {
                res.render("pages/review_details", {reviews: review});
            }

        }).then(function (sticker) {
            let sticker_url = sticker.get("uri").url();
            res.render("pages/review_details", {reviews: _review, sticker_url: sticker_url});

        }, function (error) {
            console.log("ERROR WHEN RETRIEVING REVIEW " + error.message);
            res.redirect('/reviews');
        });
    } else {
        res.redirect('/');

    }
});


app.post('/review/sticker/:stickerId/:packId', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.stickerId;
    let pack_id = req.params.packId;
    let field = req.body.review_field;
    let comments = req.body.review_text;
    let status = req.body.flagged;

    let review_field = field.split(",");

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            let Sticker_review = new Parse.Object.extend(_class.Reviews);
            let reviews = new Sticker_review();

            new Parse.Query(_class.Stickers).equalTo("objectId", id).first().then(function (sticker) {
                if (status === "2") {
                    sticker.set("flag", true);
                } else if (status === "1") {
                    sticker.set("flag", false);
                }
                reviews.set("image", sticker.get("uri").url());
                reviews.set("name", sticker.get("stickerName"));
                reviews.set("owner", sticker.get("user_id"));

                let _pack = sticker.get("parent");
                _pack.fetch({
                    success: function (_pack) {

                        reviews.set("pack_id", _pack.id);

                    }
                });

                return sticker.save();

            }).then(function () {

                if (status === "1") {
                    reviews.set("approved", true);
                } else if (status === "2") {
                    reviews.set("approved", false);
                }
                reviews.set("comments", comments);
                reviews.set("reviewer", _user.id);
                reviews.set("reviewer_name", _user.get("name"));
                reviews.set("type_id", id);
                reviews.set("review_field", review_field);

                reviews.set("type", 1);
                return reviews.save();

            }).then(function () {

                console.log("STICKER REVIEWED");
                res.redirect("/pack/" + pack_id);

            }, function (error) {

                console.log("STICKER REVIEW FAILED " + error.message);
                res.redirect("/sticker/edit/" + id + "/" + pack_id);

            });
        });
    } else {
        res.redirect('/');
    }
});

app.get('/review/find/packs', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("status", type.PACK_STATUS.review).find();

        }).then(function (pack) {

            res.render("pages/packs_for_admin", {

                collection: pack

            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');

        });

    } else {
        res.redirect('/');

    }
});


/*====================================== REVIEWS ============================*/


/*====================================== PACKS ============================*/

// Collection Dashboard
app.get('/packs', function (req, res) {

    var token = req.cookies.token;

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            let query = new Parse.Query(_class.Packs);
            query.equalTo("user_id", _user.id).find({sessionToken: token}).then(function (collections) {

                res.render("pages/packs", {collections: collections});

            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect("/");
        })
    }

    else {
        console.log("No Session Exists, log in");
        res.redirect("/");
    }
});

// creating new pack
app.post('/pack', function (req, res) {

    var token = req.cookies.token;
    var pack_description = req.body.pack_description;
    var coll_name = req.body.coll_name;
    var pricing = parseInt(req.body.pricing);
    var version = parseInt(req.body.version);

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            var PackCollection = new Parse.Object.extend(_class.Packs);
            var pack = new PackCollection();
            pack.set("pack_name", coll_name);
            pack.set("pack_description", pack_description);
            pack.set("user_id", _user.id);
            pack.set("user_name", _user.get("name"));
            pack.set("status", type.PACK_STATUS.pending);
            pack.set("pricing", pricing);
            pack.set("version", version);
            pack.set("archive", false);
            pack.set("flag", false);
            pack.set("published", false);

            return pack.save();

        }).then(function (collection) {

            res.redirect('/pack/' + collection.id);

        }, function (error) {
            console.log("ERROR OCCURRED WHEN ADDING NEW PACK " + error.message);
            console.log('/');
        })
    }
    else {
        res.redirect("/");
    }
});

//Displays all stickers belonging to a selected collection
app.get('/pack/:id', function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {

        let _user = {};
        let type;
        let pack_name;
        let pack_status;
        let artwork;

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            type = _user.get("type");

            let query = new Parse.Query(_class.Packs).equalTo("objectId", pack_id);

            switch (type) {
                case SUPER_USER:
                    return query.first({useMasterKey: true});

                case NORMAL_USER:
                    return query.first({sessionToken: token});

            }

        }).then(function (pack) {

            pack_status = pack.get("status");
            pack_art = pack.get("art_work");
            pack_publish = pack.get("published");
            pack_name = pack.get("pack_name");

            let col = pack.relation(_class.Packs);

            switch (type) {
                case SUPER_USER:
                    return col.query().find({useMasterKey: true});

                case NORMAL_USER:
                    return col.query().find({sessionToken: token});

            }
        }).then(function (stickers) {

            switch (type) {
                case SUPER_USER:
                    res.render("pages/admin_pack", {
                        stickers: stickers,
                        id: pack_id,
                        art: pack_art,
                        published: pack_publish,
                        pack_name: pack_name,
                        userType: _user.get("type"),
                        status: pack_status
                    });
                    break;

                case NORMAL_USER:
                    res.render("pages/new_pack", {
                        stickers: stickers,
                        id: pack_id,
                        pack_name: pack_name,
                        art: pack_art,
                        published: pack_publish,
                        status: pack_status
                    });
                    break;
            }

        }, function (error) {
            console.log("score lookup failed with error.code: " + error.code + " error.message: " + error.message);
            res.redirect("/");
        })
    }
    else {
        //No session exists, log in
        res.redirect("/");
    }
});

app.get('/pack/edit/:id', function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            res.render("pages/pack_details", {
                pack_details: pack
            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect("/pack/" + pack_id);
        })
    } else {
        res.redirect('/');
    }
});

app.post('/pack/edit/:id', upload.array('art'), function (req, res) {

    let token = req.cookies.token;
    let files = req.files;
    let id = req.params.id;
    let keywords = req.body.keyword;
    let archive = req.body.archive;
    let description = req.body.description;
    let _keywords = [];
    let fileDetails = [];
    let _previews = [];

    if (keywords !== undefined || keywords !== "undefined") {
        _keywords = keywords.split(",");
    }

    if (archive === undefined || archive === "undefined") {
        archive = false;
    } else if (archive === 1 || archive === "1") {
        archive = true;
    } else if (archive === 0 || archive === "0") {
        archive = false;
    }

    if (token) {

        getUser(token).then(function (sessionToken) {

            return util.thumbnail(files)

        }).then(previews => {

            _previews = previews;

            return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

        }).then(function (pack) {


            pack.set("pack_description", description);
            pack.set("keyword", _keywords);
            pack.set("archive", archive);

            if (files !== undefined || files !== "undefined") {
                files.forEach(function (file) {
                    let fullName = file.originalname;
                    let stickerName = fullName.substring(0, fullName.length - 4);

                    let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                    let bitmapPreview;
                    let parseFilePreview = "";

                    _.map(_previews, preview => {
                        if (stickerName === preview.name) {
                            bitmapPreview = fs.readFileSync(preview.path, {encoding: 'base64'});
                            parseFilePreview = new Parse.File(stickerName, {base64: bitmapPreview}, preview.mimetype);
                        }
                    });

                    let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);

                    pack.set("art_work", parseFile);
                    pack.set("preview", parseFilePreview);
                    fileDetails.push(file);

                });
            }

            return pack.save();

        }).then(function (pack) {

            _.each(fileDetails, function (file) {
                //Delete tmp fil after upload
                var tempFile = file.path;
                fs.unlink(tempFile, function (error) {
                    if (error) {
                        //TODO handle error code
                        //TODO add job to do deletion of tempFiles
                        console.log("-------Could not del temp" + JSON.stringify(error));
                    }
                    else {
                        console.log("-------Deleted All Files");

                    }
                });
            });

            return true;

        }).then(function () {

            res.redirect('/pack/edit/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/pack/edit/' + id);

        })
    } else {
        res.redirect('/');
    }

});

app.post('/pack/review/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let name = req.body.pack_name;
    let archive = req.body.archive;
    let description = req.body.pack_description;
    let keyword = req.body.keyword;
    let review_id = req.body.review_id;

    let key = keyword.split(",");

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Packs).equalTo("objectId", id).first();
        }).then(function (pack) {
            pack.set("name", name);

            if (archive === undefined || archive === "1") {
                pack.set("archive", false);
            } else if (archive === "0") {
                pack.set("archive", true);
            }
            pack.set("pack_description", description);
            pack.set("keyword", key);

            return pack.save();

        }).then(function (result) {
            res.redirect('/review/edit/' + review_id);
        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/review/edit/' + review_id);
        });
    } else {
        res.redirect('/');
    }
});

app.get('/pack/review/update/status/:id', function (req, res) {

    var token = req.cookies.token;
    var pack_id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            pack.set("status", type.PACK_STATUS.review);
            return pack.save();

        }).then(function () {

            console.log("PACK SUBMITTED FOR REVIEW");
            res.redirect('/pack/' + pack_id);

        }, function (error) {

            console.log("PACK NOT SUBMITTED FOR REVIEW. ERROR " + error.message);
            res.redirect('/pack/' + pack_id);

        });
    } else {
        res.redirect('/');
    }
});

app.post('/review/:itemId/:packId/:reviewId', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.itemId;
    let pack_ = req.params.packId;
    let review_id = req.params.reviewId;
    let type = req.body.type;
    let categoryNames = [];
    let all;
    let name;
    let category;
    let sticker;

    if (token) {
        let _user = {};

        if (type === "1") {
            getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(_class.Stickers).equalTo("objectId", id).first(),
                    new Parse.Query(_class.Categories).find()
                );

            }).then(function (sticker, categories) {

                    stickerDetail = sticker;
                    allCategories = categories;

                    let sticker_relation = sticker.relation(_class.Categories);
                    return sticker_relation.query().find();

                }
            ).then(function (stickerCategories) {

                _.each(stickerCategories, function (category) {
                    categoryNames.push(category.get("name"))
                });

                return new Parse.Query(_class.Reviews).equalTo("objectId", review_id).first();

            }).then(function (review) {

                let review_fields = review.get("review_field");
                let review_field = Array.from(review_fields);

                for (let time = 0; time < review_field.length; time++) {
                    if (review_field[time] === "all") {
                        all = review_field[time];
                    } else if (review_field[time] === "name") {
                        name = review_field[time];
                    } else if (review_field[time] === "category") {
                        category = review_field[time];
                    } else if (review_field[time] === "sticker") {
                        sticker = review_field[time];
                    }
                }

                res.render("pages/edit_sticker", {
                    sticker: stickerDetail,
                    categoryNames: categoryNames,
                    categories: allCategories,
                    pack_id: pack_,
                    all: all,
                    name: name,
                    sticker_details: sticker,
                    category: category,
                    review_id: review_id
                });

            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/review/edit/' + review_id);
            });
        } else {
            getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

            }).then(function (pack) {

                res.render("pages/edit_pack", {pack: pack, review_id: review_id});

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect('/review/edit/' + review_id);

            });
        }
    } else {
        res.redirect('/')
    }

});

/*====================================== PACKS ============================*/

app.get('/publish/:type/:status/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let status = req.params.status;
    let type = req.params.type;

    if (token) {

        getUser(token).then(function (sessionToken) {

            switch (type) {
                case "pack":
                    return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

                case "story":
                    return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

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
                case "pack":
                    res.redirect("/pack/" + id);
                    return;

                case "story":
                    res.redirect("/storyedit/" + id);
                    return;
            }

        }, function (error) {

            console.log("ERROR " + error.message);

            switch (type) {
                case "pack":
                    res.redirect("/pack/" + id);
                    return;

                case "story":
                    res.redirect("/storyedit/" + id);
                    return;
            }

        })
    } else {
        res.redirect('/');
    }

});

/*====================================== STICKERS ============================*/

// Add Stickers Version 1
app.get('/uploads/computer/:id', function (req, res) {

    var token = req.cookies.token;
    var pack_id = req.params.id;

    if (token) {
        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            res.render("pages/add_sticker", {id: pack.id, pack_name: pack.get("pack_name")});

        }, function (error) {
            res.redirect("/");

        })
    } else {
        res.redirect("/");
    }
});

app.post('/uploads/computer', upload.array('im1[]'), function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.body.pack_id;
    let files = req.files;
    let fileDetails = [];
    let stickerDetails = [];
    let stickerCollection;
    let _previews = [];

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let db = admin.database();

            // change this to shorter folder
            let ref = db.ref("server/saving-data/fireblog");

            let statsRef = ref.child("/gstickers-e4668");

            //TODO implement DRY for thumbnails
            util.thumbnail(files).then(previews => {

                _previews = previews;

                return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first({sessionToken: token});

            }).then(function (collection) {

                stickerCollection = collection;

                files.forEach(function (file) {

                    let Sticker = new Parse.Object.extend(_class.Stickers);
                    let sticker = new Sticker();

                    let fullName = file.originalname;
                    let stickerName = fullName.substring(0, fullName.length - 4);

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
                    sticker.set("stickerName", stickerName);
                    sticker.set("localName", stickerName);
                    sticker.set("uri", parseFile);
                    sticker.set("preview", parseFilePreview);
                    sticker.set("user_id", _user.id);
                    sticker.set("parent", collection);
                    sticker.set("description", "");
                    sticker.set("flag", false);
                    sticker.set("archive", false);
                    sticker.set("sold", false);
                    sticker.set("version", collection.get("version"));
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
                            console.log("SUUCCCEESSSSS IN DELTEING TEMP");
                        }
                    });
                });

                _.each(stickers, function (sticker) {
                    let collection_relation = stickerCollection.relation(_class.Packs);
                    collection_relation.add(sticker);
                });

                console.log("SAVE COLLECTION RELATION");
                return stickerCollection.save();

            }).then(function () {

                let data = {
                    //Specify email data
                    from: process.env.EMAIL_FROM || "test@example.com",
                    //The email to contact
                    to: _user.get("username"),
                    //Subject and text data
                    subject: 'Stickers Uploaded',
                    html: fs.readFileSync("./uploads/sticker_upload.html", "utf8")
                };

                mailgun.messages().send(data, function (error, body) {
                    if (error) {
                        console.log("BIG BIG ERROR: ", error.message);
                    }
                    else {

                        console.log("EMAIL SENT" + body);
                    }
                });

                statsRef.transaction(function (sticker) {
                    if (sticker) {
                        if (sticker.stickers) {
                            sticker.stickers++;
                        }
                    }

                    return sticker
                });


            }).then(function (stickers) {

                res.redirect("/pack/" + pack_id);

            }, function (error) {

                console.log("BIG BIG ERROR" + JSON.stringify(error));
                res.redirect("/pack/" + pack_id);

            })
        }, function (error) {
            console.log("BIG BIG ERROR" + error.message);
            res.redirect("/");
        });


    } else {

        res.redirect("/");

    }
});

app.post('/sticker/review/:id/:pid', upload.array('im1'), function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let pid = req.params.pid;
    let name = req.body.sticker_name;
    let category = req.body.category;
    let categories = req.body.categories;
    let review_id = req.body.review_id;
    let files = req.files;
    let _category = [];
    let category_names;
    let _category_names;

    if (token) {
        let _user = {};

        if (category !== undefined) {
            category_names = Array.from(category);
            _category = category_names;
        }

        if (categories !== undefined) {

            _category_names = Array.from(categories);

            if (_category.length !== 0) {
                _category = _category.concat(_category_names);
            } else {
                _category = _category_names;
            }
        }

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();

        }).then(function (sticker) {

            files.forEach(function (file) {

                let fullName = file.originalname;
                let stickerName = fullName.substring(0, fullName.length - 4);

                let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                //create our parse file
                let parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);

                sticker.set("uri", parseFile);


            });
            sticker.set("name", name);
            sticker.set("categories", _category);

            return sticker.save();

        }).then(function (result) {

            _.each(files, function (file) {
                //Delete tmp fil after upload
                var tempFile = file.path;
                fs.unlink(tempFile, function (error) {
                    if (error) {
                        //TODO handle error code
                        //TODO add job to do deletion of tempFiles
                        console.log("-------Could not del temp" + JSON.stringify(error));
                    }
                    else {
                        console.log("-------Deleted All Files");

                    }
                });
            });

            res.redirect('/pack/' + pid);
        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/review/edit/' + review_id);
        });
    } else {
        res.redirect('/');
    }

});

//EDIT/STICKER DETAILS
app.get('/sticker/edit/:stickerId/:packId', function (req, res) {

    let token = req.cookies.token;
    let stickerId = req.params.stickerId;
    let packId = req.params.packId;
    // let stickers = req.params.stickers;
    let _sticker;
    let _categories;
    let selectedCategories;
    let _pack = [];

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first(),
                new Parse.Query(_class.Categories).ascending("name").find(),
                new Parse.Query(_class.Packs).equalTo("objectId", packId).first()
            );

        }).then(function (sticker, categories, pack) {

                _sticker = sticker;
                _categories = categories;
                _pack = pack;
                selectedCategories = sticker.get("categories");

                console.log("SELECTED " + selectedCategories);

                let sticker_relation = sticker.relation(_class.Categories);
                return sticker_relation.query().find();

            }
        ).then(function (stickerCategories) {

            // var categoryNames = [];
            // _.each(stickerCategories, function (category) {
            //     categoryNames.push(category.get("name"))
            // });

            // console.log("CATEGORY NAMES " + categoryNames);

            // if (_user.get("type") === SUPER_USER) {
            //     res.render("pages/admin_details", {
            //         sticker: stickerDetail,
            //         // categoryNames: categoryNames.sort(),
            //         categories: allCategories,
            //         pack_id: pack_
            //     });
            // } else {


            //TODO how to catch error when time expires (Check APIs)
            // const AWS = require('aws-sdk');
            //
            // const s3 = new AWS.S3();
            // AWS.config.update({
            //     accessKeyId: 'AKIAINM7RXYLJVMDEMLQ',
            //     secretAccessKey: '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'
            // });
            //
            //
            // const myBucket = 'cyfa';
            // let name = stickerDetail.get("uri").name();
            //
            // const key = name;
            // const signedUrlExpireSeconds = 60 * 5;
            //
            // const url = s3.getSignedUrl('getObject', {
            //     Bucket: myBucket,
            //     Key: key,
            //     Expires: signedUrlExpireSeconds
            // });
            //
            let col = _pack.relation(_class.Packs);
            return col.query().find({sessionToken: token});

            // }
        }).then(function (stickers) {

            let page = util.page(stickers, stickerId);

            res.render("pages/sticker_details", {
                sticker: _sticker,
                selected: selectedCategories,
                categories: _categories,
                pack_id: packId,
                next: page.next,
                previous: page.previous,
                // uri: url,
                id: stickerId
            });

        }, function (err) {
            console.log("Error Loading-----------------------" + JSON.stringify(err));
            res.redirect("/pack/" + packId);

        });
    }
    else {
        res.redirect("/");
    }
});

//Update Sticker
app.post('/sticker/edit/:id/:pid', function (req, res) {

    let token = req.cookies.token;

    //input fields from form
    let stickerName = req.body.stickerName;
    let new_categories = req.body.categories;
    let stickerId = req.params.id;
    let packId = req.params.pid;
    let sticker_status = req.body.sticker_status;
    let description = req.body.description;

    let _listee = [];

    if (new_categories) {

        if (new_categories !== undefined) {
            let category_new = Array.from(new_categories);

            _.each(category_new, function (category) {
                _listee.push(category);
            });
        }
    }

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

        }).then(function (sticker) {

            sticker.set("stickerName", stickerName);
            sticker.set("localName", stickerName);
            sticker.set("categories", _listee);
            if (sticker_status === "1") {
                sticker.set("sold", true);
            } else if (sticker_status === "0") {
                sticker.set("sold", false);
            }
            sticker.set("description", description);

            return sticker.save();

        }).then(function (sticker) {

            console.log("STICKER UPDATED" + JSON.stringify(sticker));
            res.redirect("/sticker/edit/" + stickerId + "/" + packId);

        }, function (error) {

            console.log("SERVER ERROR " + error.message);
            res.redirect("/sticker/edit/" + stickerId + "/" + packId);

        });

    } else {

        console.log("No session found[[[[[[");
        res.redirect("/pack/" + packId);

    }
});

app.get('/uploads/dropbox/:id', function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {
        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            res.render("pages/upload", {id: pack_id, pack_name: pack.get("pack_name")});


        }, function (error) {
            res.redirect('/');
        })
    } else {
        res.redirect("/");
    }

});

app.post('/uploads/dropbox', function (req, res) {
    let bitmap;
    let name;
    let fileUrl;
    let token = req.cookies.token;
    let pack_id = req.body.pack_id;
    let stickerPack;

    name = req.body.fileName;
    fileUrl = req.body.fileUrl; // receive url from form
    name = name.substring(0, name.length - 4);

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            var options = {
                url: fileUrl,
                dest: __dirname + '/public/uploads/' + req.body.fileName
            }

            download.image(options)
                .then(({filename, image}) => {

                    bitmap = fs.readFileSync(filename, {encoding: 'base64'});

                    let pack = new Parse.Query(_class.Packs);
                    pack.equalTo("objectId", pack_id)
                        .first({sessionToken: token})
                        .then(function (pack) {

                            stickerPack = pack;

                            let parseFile = new Parse.File(name, {base64: bitmap});
                            let Sticker = new Parse.Object.extend(_class.Stickers);
                            let sticker = new Sticker();

                            sticker.set("stickerName", name);
                            sticker.set("localName", name);
                            sticker.set("user_id", _user.id);
                            sticker.set("uri", parseFile);
                            sticker.set("parent", pack);
                            sticker.set("flag", false);
                            sticker.set("archive", false);
                            sticker.set("sold", false);

                            return sticker.save();

                        }).then(function (sticker) {

                        let pack_relation = stickerPack.relation(_class.Packs);

                        pack_relation.add(sticker);

                        fs.unlink(filename, function (err) {
                            if (err) {
                                //TODO handle error code
                                console.log("Could not del temp++++++++" + JSON.stringify(err));
                            }
                        });

                        return stickerPack.save();

                    }).then(function () {

                        console.log("REDIRECT TO DASHBOARD");
                        res.redirect("/pack/" + pack_id);

                    }, function (error) {
                        console.log("BIG BIG ERROR" + error.message);
                        res.redirect("/pack/" + pack_id);
                    });
                }).catch((err) => {
                throw err;
            });
        }, function (error) {
            console.log("SESSION INVALID " + error.message);
            res.redirect("/pack/" + pack_id);
        });

    } else {

        res.redirect("/pack/" + pack_id);

    }

});

app.get('/find/sticker/:name', function (req, res) {

    let token = req.cookies.token;
    let name = req.params.name;
    let field = [];

    if (token) {

        field.push(name);

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stickers).containedIn("categories", field).find();

        }).then(function (stickers) {

            res.render("pages/associated_stickers", {
                stickers: stickers,
                name: name
            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/categories');
        })
    } else {
        res.redirect('/');
    }

});

//This is to remove stickers
app.get('/sticker/delete/:id/:packId', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let pack_id = req.params.packId;


    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();

        }).then(function (_sticker) {
                _sticker.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        res.redirect("/pack/" + pack_id);
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                        res.redirect("/pack/" + pack_id);

                    }
                });
            },
            function (error) {
                console.error(error);
                res.redirect("/pack/" + pack_id);

            });
    } else {
        res.redirect('/');
    }

});

app.post('/sticker/decsription/:id', function (req, res) {

    let token = req.cookies.token;
    let stickerId = req.params.id;
    let description = req.body.description;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

        }).then(function (sticker) {

            sticker.set("description", description);

            return sticker.save();

        }).then(function () {

            res.redirect('/home');

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');

        })
    }

});


/*====================================== STICKERS ============================*/


/*====================================== FEED ============================*/

app.post('/feed/:type', function (req, res) {

    let token = req.cookies.token;
    let type = req.params.type;
    let id = req.body.element_id;


    if (token) {

        getUser(token).then(function (sessionToken) {
            switch (type) {
                case "sticker":
                    return new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first();

                case "story":
                    return new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first();

            }

        }).then(function (latest) {

            latest.set("latest_id", id);

            return latest.save();

        }).then(function () {

            let Selected = new Parse.Object.extend(_class.PreviouslySelected);
            let selected = new Selected();

            switch (type) {
                case "sticker":
                    selected.set("type", 0);
                    selected.set("object_id", id);
                    break;
                case "story":
                    selected.set("type", 1);
                    selected.set("object_id", id);
                    break;
            }

            return selected.save();

        }).then(function () {

            switch (type) {
                case "sticker":
                    return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();
                case "story":
                    res.redirect('/home');

            }


        }).then(function (sticker) {

            if (sticker.get("description") === "" || sticker.get("description") === undefined) {
                res.render("pages/add_description", {
                    sticker: sticker
                })
            } else {
                res.redirect('/home');
            }
        }, function (error) {

            console.log("ERROR " + error.message);
            switch (type) {
                case "sticker":
                    res.redirect('/feed/sticker');
                    break;

                case "story":
                    res.redirect('/feed/story');
                    break;
            }

        });
    } else {

        res.redirect('/');

    }

});


app.get('/feed/sticker', function (req, res) {

    let token = req.cookies.token;
    let _user = {};

    if (token) {

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let query = new Parse.Query(_class.Stickers);
            query.equalTo("sold", false);
            query.equalTo("user_id", _user.id);
            return query.find();

        }).then(function (stickers) {

            res.render("pages/sticker_of_day", {
                stickers: stickers
            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    } else {
        res.redirect('/');

    }
});

app.get('/feed/story', function (req, res) {

    let token = req.cookies.token;
    let _stories = [];
    let artWork = [];
    let _allArtwork = [];
    let combined = [];
    let _user = {};

    if (token) {

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Stories).equalTo("user_id", _user.id).find(),
                new Parse.Query(_class.ArtWork).find()
            )

        }).then(function (stories, artworks) {

            _allArtwork = artworks;

            if (_stories) {

                _.each(stories, function (story) {
                    if (story.get("published") === true) {

                        _stories.push(story);

                    }
                });

                _.each(artworks, function (artwork) {

                    artWork.push(artwork.get("sticker"));

                });

                return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find();
            } else {
                res.render("pages/story_of_day", {

                    stories: [],
                    artworks: []

                });
            }

        }).then(function (stickers) {

            _.each(_allArtwork, function (artworks) {

                _.each(stickers, function (sticker) {

                    if (artworks.get("sticker") === sticker.id) {

                        combined.push({
                            story: artworks.get("object_id"),
                            image: sticker.get("uri").url()
                        });
                    }
                })
            });

            res.render("pages/story_of_day", {

                stories: _stories,
                artworks: combined

            });


        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    } else {
        res.redirect('/');

    }
});

/*====================================== FEED ============================*/

/*====================================== NEWSLETTER ============================*/

app.get('/newsletter/story/:storyId', function (req, res) {

    //delete all items in the database
    let storyId = req.params.storyId;
    let _story;
    let colors;


    Parse.Promise.when(
        new Parse.Query(_class.Stories).equalTo("objectId", storyId).first(),
        new Parse.Query(_class.ArtWork).equalTo("object_id", storyId).first()
    ).then(function (story, sticker) {

        _story = story;

        colors = story.get("color");

        if (!colors) {
            //use system default
            colors = type.DEFAULT.color;
        }

        return Parse.Promise.when(
            new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("sticker")).first(),
            new Parse.Query(_class.StoryItems).equalTo("story_id", _story.id).find()
        )

    }).then(function (sticker, storyItems) {

        res.render("pages/newsletter", {
            story: _story,
            sticker: sticker,
            colors: colors,
            storyItems: storyItems
        });

    }, function (error) {
        console.log("ERROR " + error.message);
        res.redirect('/stories');
    })

});

app.post('/newsletter/email', function (req, res) {

    let email = req.body.email;

    function subscriptionTemplate(id) {

        let file = fs.readFileSync('./views/pages/newsletter_email.ejs', 'ascii');

        return ejs.render(file, {id: id, serverURL: SERVER_URL});
    }

    if (email) {

        new Parse.Query(_class.NewsLetter).equalTo("email", email).first().then(function (newsletter) {

            if (newsletter) {
                if (newsletter.get("subscribe") === false) {

                    return subscriptionTemplate(newsletter.id);

                    // res.redirect('/newsletter/update/' + newsletter.id);

                } else if (newsletter.get("subscribe") === true) {

                    res.render("pages/newsletter_already_subscribed");

                }
            } else {

                let NewsLetter = new Parse.Object.extend(_class.NewsLetter);
                let newsletter = new NewsLetter();

                newsletter.set("email", email);
                newsletter.set("subscribe", false);

                return newsletter.save();
            }

        }).then(function (newsletter) {

            if (newsletter.id) {

                return subscriptionTemplate(newsletter.id);

            }

            return newsletter;

        }).then(function (htmlString) {

            let data = {
                //Specify email data
                from: process.env.EMAIL_FROM || "test@example.com",
                //The email to contact
                to: email,
                //Subject and text data
                subject: 'G-Stickers Newsletter Subscription',
                // html: fs.readFileSync("./uploads/newsletter_email.ejs", "utf8"),
                html: htmlString

            };

            //TODO update to use promises
            mailgun.messages().send(data, function (error, body) {
                if (error) {
                    console.log("BIG BIG ERROR: ", error.message);
                }
                else {

                    console.log("EMAIL SENT" + body);
                }
            });

            res.render("pages/newsletter_subscribe");

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('')
        })


    }
});

app.get('/newsletter/update/:id', function (req, res) {

    let id = req.params.id;

    return new Parse.Query(_class.NewsLetter).equalTo("objectId", id).first().then(function (newsletter) {

        newsletter.set("subscribe", true);

        return newsletter.save();

    }).then(function () {

        // TODO display type of update before changing subscription to true
        res.render("pages/newsletter_updates");

    }, function (error) {

        console.log("ERROR " + error.message);

    })
});


app.get('/newsletter/send/story', function (req, res) {

    let _newsletters;
    let _story;
    let emails = [];
    let colors;

    return Parse.Promise.when(
        new Parse.Query(_class.NewsLetter).equalTo("subscribe", true).find(),
        new Parse.Query(_class.Stories).equalTo("objectId", 'VcTBweB2Mz').first(),
        new Parse.Query(_class.ArtWork).equalTo("object_id", 'VcTBweB2Mz').first()
    ).then(function (newsletters, story, sticker) {

        console.log("COLLECTED ALL DATA");

        _newsletters = newsletters;
        _story = story;

        colors = story.get("color");
        if (!colors) {
            //use system default
            colors = type.DEFAULT.color;
        }

        return Parse.Promise.when(
            new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("sticker")).first(),
            new Parse.Query(_class.StoryItems).equalTo("story_id", _story.id).find()
        )

    }).then(function (sticker, storyItems) {

        console.log("COLLECTED ALL DATA 2");

        _.each(_newsletters, function (newsletter) {

            emails.push(newsletter.get("email"));

        });

        let file = fs.readFileSync('./views/pages/newsletter_story.ejs', 'ascii');

        return ejs.render(file, {
            story: _story,
            sticker: sticker,
            colors: colors,
            storyItems: storyItems
        });


    }).then(function (htmlString) {

        return mailgun.messages().send({
            from: process.env.EMAIL_FROM || "test@example.com",
            to: emails.toString(),
            subject: _story.get("title"),
            html: htmlString

        });

    }).then(() => {

        res.send("EMAIL SENT");

    }, function (error) {

        console.log("ERROR " + error.message);

    })
});


/*====================================== NEWSLETTER ============================*/

/*====================================== EXPERIMENTS ============================*/


app.get("/test_upload/:id", function (req, res) {
    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {
        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            res.render("pages/testupload", {id: pack.id, pack_name: pack.get("pack_name")});

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

            _user = sessionToken.get("user")
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

            var queryRole = new Parse.Query(Parse.Role);
            queryRole.equalTo('name', 'Administrator');
            queryRole.first({
                success: function (admin) {
                    console.log("ADMIN " + JSON.stringify(admin));

                    var adminRelation = admin.Relation('_User');

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
