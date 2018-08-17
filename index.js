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
let notification = require('./cloud/modules/notifications');
let create = require('./cloud/modules/create');

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
        let _allProducts = [];
        let stickerId;
        let _latestSticker = "";
        let _latestStory = "";
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
                res.redirect('/barcodes');
            }

            return Parse.Promise.when(
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first(),
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first(),
                new Parse.Query(_class.Packs).equalTo("userId", _user.id).descending("createdAt").limit(limit).find(),
                new Parse.Query(_class.Categories).limit(limit).find(),
                new Parse.Query(_class.Stories).equalTo("userId", _user.id).descending("createdAt").limit(limit).find(),
                new Parse.Query(_class.Packs).equalTo("userId", _user.id).find(),
                new Parse.Query(_class.Categories).count(),
                new Parse.Query(_class.Packs).equalTo("userId", _user.id).count(),
                new Parse.Query(_class.Stickers).equalTo("userId", _user.id).count(),
                new Parse.Query(_class.Stories).equalTo("userId", _user.id).count(),
                new Parse.Query(_class.Adverts).equalTo("userId", _user.id).limit(limit).find(),
                new Parse.Query(_class.Message).limit(limit).find(),
                new Parse.Query(_class.Product).limit(limit).find()
            );

        }).then(function (sticker, latestStory, collection, categories, story, allPacks, categoryLength, packLength,
                          stickerLength, storyLength, allAdverts, allMessages, products) {

            _categories = categories;
            _collection = collection;
            _story = story;
            _messages = allMessages;
            _allPacks = allPacks;
            _allAds = allAdverts;
            _allProducts = products;
            _categoryLength = helper.leadingZero(categoryLength);
            _packLength = helper.leadingZero(packLength);
            _stickerLength = helper.leadingZero(stickerLength);
            _storyLength = helper.leadingZero(storyLength);

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("feedId")).first(),
                new Parse.Query(_class.ArtWork).equalTo("itemId", latestStory.get("feedId")).first(),
                new Parse.Query(_class.Stories).equalTo("objectId", latestStory.get("feedId")).first()
            );

        }).then(function (latestSticker, storyImage, storyBody) {


            _latestSticker = latestSticker.get("uri");
            _latestSticker['stickerName'] = latestSticker.get("name");
            _latestSticker['description'] = latestSticker.get("description");

            if (storyBody !== undefined) {

                _storyBody = storyBody;

            } else {

                _storyBody = "";

            }

            if (storyImage !== undefined) {
                stickerId = storyImage.get("stickerId");

                return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

            } else {
                stickerId = "";

                return stickerId;

            }

        }).then(function (sticker) {

            if (_user.get("type") === NORMAL_USER) {

                res.render("pages/dashboard/home", {
                    collections: _collection,
                    allPacks: _allPacks,
                    allProducts: _allProducts,
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

                res.render("pages/dashboard/admin_home", {
                    collections: _collection,
                    categories: _categories,
                    allAdverts: _allAds,
                    allProducts: _allProducts,
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
                    error_message: "null",
                    type: type

                });

            }

        }, function (error) {

            console.log("ERROR ON HOME " + error.message);

            res.render("pages/dashboard/admin_home", {
                collections: _collection,
                categories: _categories,
                allAdverts: _allAds,
                allProducts: _allProducts,
                allPacks: _allPacks,
                story: _story,
                latestSticker: _latestSticker,
                latestStory: "",
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
        res.render("pages/accounts/login",
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

});

// creating a new author
app.post('/author', function (req, res) {

    let token = req.cookies.token;
    let name = req.body.authorName;
    let email = req.body.authorEmail;
    let phone = req.body.authorNumber;
    let socialMedia = req.body.authorSocial;

    if (token) {

        getUser(token).then(function (sessionToken) {

            let Author = new Parse.Object.extend(_class.Authors);
            let author = new Author();

            author.set("name", name);
            author.set("email", email);
            author.set("phone", phone);
            author.set("socialHandles", socialMedia);

            return author.save();

        }).then(function (author) {

            res.redirect('/authors');

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home')
        })

    } else {
        res.redirect('/');
    }
});

app.post('/author/edit/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let name = req.body.authorName;
    let email = req.body.authorEmail;
    let phone = req.body.authorNumber;
    let socialMedia = req.body.socialMedia;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Authors).equalTo("objectId", id).first();

        }).then(function (author) {

            author.set("name", name);
            author.set("email", email);
            author.set("phone", phone);
            author.set("socialHandles", socialMedia);

            return author.save();

        }).then(function (author) {

            res.redirect('/author/' + author.id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/author/' + id);
        })

    } else {
        res.redirect('/');
    }
});

app.get('/author/view/:authorId/:storyId', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.authorId;
    let storyId = req.params.storyId;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Authors).equalTo("objectId", id).first();

        }).then(function (author) {

            res.render("pages/stories/view_author", {
                author: author,
                storyId: storyId
            })
        }, function (error) {
            res.redirect('/storyedit/' + storyId);
        })
    } else {

        res.redirect('/');

    }
});

app.get('/author/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Authors).equalTo("objectId", id).first();

        }).then(function (author) {

            res.render("pages/accounts/edit_author", {
                author: author
            })
        }, function (error) {
            res.redirect('/');
        })

    } else {

        res.redirect('/');

    }
});

app.get('/authors', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Authors).find();

        }).then(function (authors) {

            res.render("pages/accounts/authors", {
                authors: authors
            });
        });

    } else {
        res.redirect('/');
    }
});

app.get('/account/create', function (req, res) {
    let message = "";
    res.render("pages/accounts/sign_up", {error: message});
});


app.post('/account/user/update', upload.array('im1'), function (req, res) {

    let token = req.cookies.token;
    let email = req.body.email;
    let image = req.files;
    let type = parseInt(req.body.type);
    let handle = req.body.handles;
    let profile_info = [];
    let link_length = [];
    let accountRedirect = '/account/user/profile';

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Profile).equalTo("userId", _user.id).first();

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
            return new Parse.Query(_class.Links).equalTo("itemId", _user.id).find();

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

                        link.set("itemId", _user.id);
                        link.set("type", type);
                        link.set("link", handle);

                        return link.save();

                    }

                } else {
                    let Link = new Parse.Object.extend(_class.Links);
                    let link = new Link();

                    link.set("itemId", _user.id);
                    link.set("type", type);
                    link.set("link", handle);

                    return link.save();
                }


            } else {

                console.log("TYPE AND HANDLE NOT PRESENT");
                res.redirect(accountRedirect);

            }

        }).then(function () {

            res.redirect(accountRedirect);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(accountRedirect);

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

            profile.set("userId", user.id);
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
            res.render("pages/accounts/sign_up", {error: message});
        }
    });


});

app.get('/account/password/forgot', function (req, res) {
    res.render("pages/accounts/forgot_password");
});


app.post('/account/password/reset', function (req, res) {
    const username = req.body.forgotten_password;

    Parse.User.requestPasswordReset(username, {
        success: function () {
            // Password reset request was sent successfully
            console.log("EMAIL was sent successfully");
            res.render("pages/accounts/password_reset_info");
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

        let status = user.get("image_set");
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

            return new Parse.Query(_class.Profile).equalTo("userId", _user.id).first();

        }).then(function (profile) {

            _profile = profile;

            return new Parse.Query(_class.Links).equalTo("itemId", profile.get("userId")).find();

        }).then(function (links) {

            res.render("pages/accounts/profile", {
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
                new Parse.Query(_class.Adverts).equalTo("userId", _user.id).find(),
                new Parse.Query(_class.AdvertImages).find(),
            );

        }).then(function (adverts, ad_images) {

            _.each(adverts, function (advert) {

                _.each(ad_images, function (image) {

                    if (advert.id === image.get("advertId")) {

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

            console.log("ADVERTS " + JSON.stringify(_adverts) + " AND " + JSON.stringify(adverts));

            res.render("pages/adverts/advert_collection", {
                adverts: _adverts,
                adverts_no_image: adverts,
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
                new Parse.Query(_class.AdvertImages).equalTo("advertId", id).find(),
                new Parse.Query(_class.Links).equalTo("itemId", id).first()
            );

        }).then(function (advert, advertImage, link) {

            console.log("LINK " + JSON.stringify(link));

            res.render("pages/adverts/advert_details", {

                ad_details: advert,
                ad_images: advertImage,
                link: link,
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
    let advertRedirect = '/advert/edit/';

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Links).equalTo("itemId", id).first();

        }).then(function (links) {

            if (links) {

                res.redirect(advertRedirect + id);

            } else {

                let Links = new Parse.Object.extend(_class.Links);
                let links = new Links();

                links.set("type", type);
                links.set("itemId", id);
                links.set("link", link);

                return links.save();
            }

        }).then(function (link) {

            res.redirect(advertRedirect + id);


        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(advertRedirect + id);

        })
    } else {

        res.redirect('/');

    }
});

app.post('/advert/image/:id', upload.array('adverts'), function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let type = parseInt(req.body.type);
    let files = req.files;
    let fileDetails = [];
    let advertDetails = [];
    let advertRedirect = '/advert/edit/';

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.AdvertImages).equalTo("advertId", id).first();

        }).then(function (advert) {

            if (files) {
                // if (advert) {
                // advertMessage = "ADVERT under category already exist";
                //     res.redirect('/advert/edit/' + id);
                // } else {
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
                    advert_image.set("advertId", id);
                    advert_image.set("uri", parseFile);
                    advert_image.set("type", type);

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
                    let tempFile = file.path;
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

            res.redirect(advertRedirect + id);


        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(advertRedirect + id);

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
    let advertRedirect = '/advert/edit/';

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Adverts).equalTo("objectId", id).first();

        }).then(function (advert) {

            advert.set("title", title);
            advert.set("description", description);

            return advert.save();

        }).then(function () {

            advertMessage = "";
            res.redirect(advertRedirect + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(advertRedirect + id);

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
            advert.set("userId", _user.id);
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
        let _latest = "";

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Stories).equalTo("userId", _user.id).descending("createdAt").find(),
                new Parse.Query(_class.Packs).equalTo("userId", _user.id).find(),
                new Parse.Query(_class.ArtWork).find(),
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first()
            );


        }).then(function (story, allPack, artworks, latest) {

            _story = story;
            _allPack = allPack;
            _allArtwork = artworks;

            if (latest) {
                _latest = latest;
            }


            _.each(artworks, function (artwork) {

                artWork.push(artwork.get("stickerId"));

            });

            return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find();

        }).then(function (stickers) {

            _.each(_allArtwork, function (artworks) {

                _.each(stickers, function (sticker) {

                    if (artworks.get("stickerId") === sticker.id) {

                        combined.push({
                            story: artworks.get("itemId"),
                            image: sticker.get("uri").url()
                        });
                    }
                })
            });

            res.render("pages/stories/stories", {
                story: _story,
                allPacks: _allPack,
                arts: combined,
                latest: _latest,
                type: type
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

            res.render("pages/stories/story_catalogue", {

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

app.post('/storyItem/html/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let types = parseInt(req.body.style);
    let content = req.body.content;
    let color = req.body.color;
    let object = {};


    if (types === type.STORY_ITEM.text) {

        object = {"0": {"text": content}};

    } else if (types === type.STORY_ITEM.bold) {

        object = {"6": {"text": content}};

    } else if (types === type.STORY_ITEM.italic) {

        object = {"5": {"text": content}};

    } else if (types === type.STORY_ITEM.italicBold) {

        object = {"8": {"text": content}};

    } else if (types === type.STORY_ITEM.color) {

        //TODO String(type.)
        object = {"14": {"text": content, "color": "#" + color}};

    }

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (storyItem) {


            storyItem.get("contents").html.push(object);
            return storyItem.save();

        }).then(function (item) {

            res.redirect('/storyItem/html/old/' + item.id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.send("ERRROR " + error.message);
        })
    } else {
        res.redirect('/');
    }
});

app.post('/storyItem/html/edit/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let storyId = req.body.id;
    let indexValue = req.body.indexValue;

    console.log("STARTING " + parseInt(indexValue));

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (story_item) {

            console.log("SECOND STAGE " + JSON.stringify(story_item));

            let html = story_item.get("contents").html;
            for (let i = 0; i < html.length; i++) {
                if (parseInt(indexValue) === i) {
                    let _html = html[i];
                    let typeOfObject = Object.keys(_html);
                    let content = Object.values(_html)[0];

                    console.log("THIRD STAGE " + typeOfObject + " AND " + JSON.stringify(content));

                    res.render("pages/stories/edit_html", {
                        type: type,
                        content: content,
                        objectType: typeOfObject,
                        story_id: storyId,
                        storyItemId: story_item.id,
                        index: indexValue
                    })
                }
            }

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect("/storyitem/view/" + storyId);
        })
    } else {
        res.redirect('/');
    }

});

app.get('/storyItem/html/edit/:id/:storyId', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let storyId = req.params.storyId;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (storyItem) {

            res.render("pages/stories/storyitem_html", {

                storyItem: storyItem,
                storyId: storyId

            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyitem/view/' + storyId);

        })
    } else {
        res.redirect('/');
    }

})

app.get('/storyItem/html/:state/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let state = req.params.state;
    let _story;

    if (token) {

        getUser(token).then(function (sessionToken) {

            if (state === "new") {
                let Story = new Parse.Object.extend(_class.StoryItems);
                let storyItem = new Story();

                storyItem.set("type", type.STORY_ITEM.html);
                storyItem.set("contents", {"html": []});
                storyItem.set("storyId", id);

                return storyItem.save();

            } else if (state === "old") {

                return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

            }
            //product.set("productId", {"android": android, "ios": ios});

        }).then(function (storyItem) {

            _story = storyItem;

            if (state === "new") {

                return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

            } else if (state === "old") {

                return new Parse.Query(_class.Stories).equalTo("objectId", storyItem.get("storyId")).first();

            }

        }).then(function (story) {

            console.log("STORY ITEM " + JSON.stringify(story));

            res.render("pages/stories/story_html", {
                name: story.get("title"),
                storyItemId: _story.id,
                storyId: story.id
            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect("/storyitem/" + id);
        })

    } else {

        res.redirect('/');
    }
});

app.get('/storyitem/view/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let sticker_array = [];
    let _storyItem;
    let _stickers = [];

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("storyId", id).find();

        }).then(function (story_item) {

            _storyItem = story_item;

            _.each(story_item, function (item) {
                if (item.get("type") === type.STORY_ITEM.sticker) {
                    sticker_array.push(item.get("contents").id);
                }
            });

            return true;

        }).then(function (image) {

            if (sticker_array.length > 0) {
                return new Parse.Query(_class.Stickers).containedIn("objectId", sticker_array).find();

            } else {
                return true;
            }

        }).then(function (stickers) {

            if (stickers) {

                _stickers = stickers;

            }

            // res.send(JSON.stringify(_storyItem));
            res.render("pages/stories/story_items", {

                story_item: _storyItem,
                story_id: id,
                stickers: _stickers,

            });
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyedit/' + id)
        })
    }
});

app.post('/storyitem/html/update/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let htmlContent = req.body.htmlContent;
    let htmlColor = req.body.htmlColor;
    let story_id = req.body.id;
    let index = parseInt(req.body.index);

    if (token) {
        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (story_item) {

            let contents = story_item.get("contents");

            let _html = contents.html[index];
            let htmlType = Object.keys(_html);

            console.log("OBJECT TYPE " + htmlType);

            if (parseInt(htmlType) !== type.STORY_ITEM.color) {

                let html = {};
                html[htmlType.toString()] = {"text": htmlContent};
                console.log("UPDATED HTML " + JSON.stringify(html));

                contents.html[index] = html;

            } else {

                let html = {};
                html[htmlType.toString()] = {"text": htmlContent, "color": htmlColor};

                contents.html[index] = html;
            }

            story_item.set("contents", contents);
            return story_item.save();

        }).then(function () {

            res.redirect('/storyitem/view/' + story_id);

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/storyItem/html/edit/' + id);
        })
    }
});

app.post('/storyitem/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let content = req.body.content;
    let story_id = req.body.id;
    let heading = req.body.heading;
    let storyItemType = parseInt(req.body.type);
    let object = {};

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (story_item) {

            if (storyItemType === type.STORY_ITEM.text || storyItemType === type.STORY_ITEM.quote ||
                storyItemType === type.STORY_ITEM.bold || storyItemType === type.STORY_ITEM.italic ||
                storyItemType === type.STORY_ITEM.italicBold || storyItemType === type.STORY_ITEM.sideNote ||
                storyItemType === type.STORY_ITEM.greyArea) {

                object = {"text": content};

            } else if (storyItemType === type.STORY_ITEM.heading) {

                object = {"heading": heading, "text": content};

            } else if (storyItemType === type.STORY_ITEM.list) {

                object = {"list": content};

            }

            story_item.set("contents", object);
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

            return new Parse.Query(_class.Stickers).limit(PARSE_LIMIT).find();

        }).then(function (stickers) {

            res.render("pages/stories/catalogue_sticker", {
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
    let sticker_url = req.body.sticker_url;
    let story_id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {
            let Story = new Parse.Object.extend(_class.StoryItems);
            let catalogue = new Story();

            catalogue.set("contents", {"id": sticker_id, "uri": sticker_url});
            catalogue.set("storyId", story_id);
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
    let storyItem = "/storyitem/";

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
            catalogue.set("contents", {"uri": image.get("uri").url(), "id":image.id});
            catalogue.set("storyId", id);

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

            res.redirect(storyItem + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(storyItem + id);

        })
    } else {
        res.redirect('/');

    }
});

app.post('/storyItem/type/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let content = req.body.content;
    let heading = req.body.heading;
    let _type = parseInt(req.body.style);

    if (token) {

        getUser(token).then(function (sessionToken) {

            let Story = new Parse.Object.extend(_class.StoryItems);
            let story = new Story();

            switch (_type) {
                case type.STORY_ITEM.text:
                    story.set("type", type.STORY_ITEM.text);
                    story.set("contents", {"text": content});
                    break;

                case type.STORY_ITEM.quote:
                    story.set("type", type.STORY_ITEM.quote);
                    story.set("contents", {"text": content});
                    break;

                case type.STORY_ITEM.divider:
                    story.set("type", type.STORY_ITEM.divider);
                    story.set("contents", {"": ""});
                    break;

                case type.STORY_ITEM.italic:
                    story.set("type", type.STORY_ITEM.italic);
                    story.set("contents", {"text": content});
                    break;

                case type.STORY_ITEM.bold:
                    story.set("type", type.STORY_ITEM.bold);
                    story.set("contents", {"text": content});
                    break;

                case type.STORY_ITEM.italicBold:
                    story.set("type", type.STORY_ITEM.italicBold);
                    story.set("contents", {"text": content});
                    break;

                case type.STORY_ITEM.list:
                    story.set("type", type.STORY_ITEM.list);
                    story.set("contents", {"text": content});
                    break;

                case type.STORY_ITEM.sideNote:
                    story.set("type", type.STORY_ITEM.sideNote);
                    story.set("contents", {"text": content});
                    break;

                case type.STORY_ITEM.greyArea:
                    story.set("type", type.STORY_ITEM.greyArea);
                    story.set("contents", {"text": content});
                    break;

                case type.STORY_ITEM.heading:
                    story.set("type", type.STORY_ITEM.heading);
                    story.set("contents", {"heading": heading, "text": content});
                    break;
            }

            story.set("storyId", id);

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
    let storyEdit = '/storyedit/';


    if (token) {

        let _user = {};
        let id;

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stories).equalTo("objectId", story_id).first();

        }).then(function (story) {
            id = story.id;

            if (state === "change") {

                return new Parse.Query(_class.ArtWork).equalTo("itemId", story.id).first();

            } else if (state === "new") {
                let Artwork = new Parse.Object.extend(_class.ArtWork);
                let artwork = new Artwork();

                artwork.set("itemId", id);
                artwork.set("stickerId", sticker_id);

                return artwork.save();
            }


        }).then(function (artwork) {

            if (state === "change") {

                artwork.set("sticker", sticker_id);

                return artwork.save();

            } else if (state === "new") {
                res.redirect(storyEdit + id);

            }

        }).then(function () {

            res.redirect(storyEdit + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/story/' + story_id);

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

            return new Parse.Query(_class.Stickers).find();

        }).then(function (stickers) {

            res.render("pages/stories/story_artwork", {
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
    let _latest = "";
    let page;

    if (token) {

        let _user = {};
        let _story = {};
        let colors = [];
        let _authors = [];
        let art;

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Stories).equalTo("objectId", story_id).first(),
                new Parse.Query(_class.ArtWork).equalTo("itemId", story_id).first(),
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first(),
                new Parse.Query(_class.Stories).equalTo("userId", _user.id).find(),
                new Parse.Query(_class.Authors).find()
            );

        }).then(function (story, sticker, latest, stories, authors) {

            _story = story;
            _authors = authors;

            if (latest) {
                _latest = latest;
            }

            page = util.page(stories, story_id);

            colors = story.get("color");

            if (colors.topColor === "" || colors === {}) {
                //use system default
                colors = type.DEFAULT.colors;

            } else {
                colors = story.get("color");

            }

            if (sticker) {

                return new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first();

            } else {
                return "";
            }


        }).then(function (_sticker) {

            art = _sticker;

            console.log("STORY INFO " + _story.get("authorId"));
            if (_story.get("authorId") === "") {

                return "";

            } else {

                return new Parse.Query(_class.Authors).equalTo("objectId", _story.get("authorId")).first();

            }

        }).then(function (author) {
            let authorName;
            let authorId;

            if (author === "") {
                authorName = "";
                authorId = "";
            } else {
                authorName = author.get("name");
                authorId = author.id;
            }
            res.render("pages/stories/story_details", {
                story: _story,
                sticker: art,
                colors: colors,
                latest: _latest,
                authors: _authors,
                author: authorName,
                authorId: authorId,
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
    let authorId = req.body.authorId;
    let _keyword = [];
    let storyEdit = '/storyedit/';

    console.log("KEYWORD " + keyword);
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
            story.set("keywords", _keyword);
            story.set("summary", summary);
            story.set("authorId", authorId);

            return story.save();

        }).then(function () {

            res.redirect(storyEdit + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(storyEdit + id);

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
    let body = req.body.summary;
    let storyType = parseInt(req.body.storyType);

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let Stories = new Parse.Object.extend(_class.Stories);
            let story = new Stories();

            story.set("title", title);
            story.set("summary", summary);
            story.set("packId", pack_id);
            story.set("keywords", []);
            // story.set("is_latest_story", false);
            story.set("published", false);
            story.set("userId", _user.id);
            story.set("status", 0);
            story.set("storyType", storyType);
            story.set("authorId", "");
            story.set("color", {topColor: "", bottomColor: ""});
            // story.set("storyObject", newObject);


            return story.save();

        }).then(function (story) {
            //     let Main = new Parse.Object.extend(_class.StoryBody);
            //     let main = new Main();
            //
            //     story_id = story.id;
            //     main.set("storyId", story.id);
            //     main.set("story", body);
            //
            //     return main.save();
            //
            // }).then(function (main) {

            res.redirect('/story/artwork/new/' + story.id);

        }, function (error) {
            console.log("ERROR WHEN CREATING NEW STORY " + error.message);
            res.redirect('/stories');
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
                new Parse.Query(_class.ArtWork).equalTo("itemId", id).first()
            );

        }).then(function (story, art) {

            _story = story;
            colors = story.get("color");

            if (colors.topColor === "" || colors === {}) {
                //use system default
                colors = type.DEFAULT.colors
            } else {
                color = story.get("color");

            }

            return new Parse.Query(_class.Stickers).equalTo("objectId", art.get("stickerId")).first();

        }).then(function (sticker) {

            res.render("pages/stories/choose_color", {
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
    let color_1 = req.body.top;
    let color_2 = req.body.bottom;
    let storyEdit = '/storyedit/';

    console.log("COLOR FROM " + color_1 + " " + color_2);

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stories).equalTo("objectId", id).first();

        }).then(function (story) {

            story.set("color", {"topColor": color_1, "bottomColor": color_2});

            return story.save();

        }).then(function () {

            res.redirect(storyEdit + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(storyEdit + id);

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
                new Parse.Query(_class.StoryBody).equalTo("storyId", id).first(),
                new Parse.Query(_class.Stories).equalTo("objectId", id).first()
            )

        }).then(function (storyBody, story) {

            res.render("pages/stories/story_page", {
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
    let storyMain = '/storymain/';

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.StoryBody).equalTo("objectId", id).first();
        }).then(function (story) {

            story_id = story.get("storyId");

            story.set("story", main_story);

            return story.save();

        }).then(function () {

            res.redirect(storyMain + story_id);

        }, function (error) {

            console.log("ERROR " + error.message)
            res.redirect(storyMain + story_id);
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
    let storyItemView = "/storyitem/view/";
    let assetId;
    let _storyItem;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (storyItem) {

            assetId = storyItem.get("contents");
            _storyItem = storyItem;

            storyItem.destroy({
                success: function (object) {
                    console.log("removed" + JSON.stringify(object));
                    return true;
                },
                error: function (error) {
                    console.log("Could not remove" + error);
                    res.redirect(storyItemView + storyId);

                }
            })

        }).then(function () {

            if (_storyItem.get("type") === type.STORY_ITEM.image) {

                return new Parse.Query(_class.Assets).equalTo("objectId", assetId.uri).first();

            } else {

                res.redirect(storyItemView + storyId);

            }

        }).then(function (asset) {

            asset.destroy({
                success: function (object) {
                    console.log("removed" + JSON.stringify(object));
                    res.redirect(storyItemView + storyId);
                },
                error: function (error) {
                    console.log("Could not remove" + error);
                    res.redirect(storyItemView + storyId);

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
    let assetArray = [];

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("storyId", id).find();

        }).then(function (stories) {

            if (stories.length > 0) {

                _.each(stories, function (items) {

                    if (items.get("type") === type.STORY_ITEM.image) {
                        assetArray.push(items.get("contents").id);
                    }
                });

                console.log("ASSETS AVAILABLE");
                return Parse.Object.destroyAll(stories);

            } else {

                return true;

            }

        }).then(function (success) {

            if (assetArray.length > 0){

                console.log("FINDING ASSETS");
                return new Parse.Query(_class.Assets).containedIn("objectId", assetArray).find();

            }else {

                res.redirect("/storydelete/" + id);

            }

        }).then(function (assets) {

            if (assets){
                console.log("ASSETS DELETING " + JSON.stringify(assets));

                return Parse.Object.destroyAll(assets);

            } else {

                res.redirect("/storydelete/" + id);

            }

        }).then(function () {

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
    let storyItemView = '/storyitem/view/';

    console.log("TYPE " + storyItemType);

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (storyItem) {

            _storyItem = storyItem;
            storyContent = storyItem.get("contents");
            _storyId = storyItem.get("storyId");

            if (storyItemType === type.STORY_ITEM.text || storyItemType === type.STORY_ITEM.quote ||
                storyItemType === type.STORY_ITEM.bold || storyItemType === type.STORY_ITEM.italic ||
                storyItemType === type.STORY_ITEM.italicBold) {

                storyItem.set("type", storyItemType);
                storyItem.set("contents", {"text": content});

                return storyItem.save();
            } else if (storyItemType === type.STORY_ITEM.divider) {

                storyItem.set("type", storyItemType);
                storyItem.set("contents", {"": ""});

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
                _storyItem.set("contents", {"uri": asset.get("uri").url(), "id": asset.id});

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

                console.log("INSIDE IMAGE" + storyContent + " STORY " + _storyItem.get("contents").uri);
                return new Parse.Query(_class.Assets).equalTo("objectId", storyContent).first();

            } else {
                res.redirect(storyItemView + storyId);

            }

        }).then(function (image) {

            console.log("IMAGE FROM ASSETS " + JSON.stringify(image));


            image.destroy({
                success: function (object) {
                    console.log("DESTROYED IAMGE " + JSON.stringify(object));
                    res.redirect(storyItemView + storyId);
                },
                error: function (error) {
                    console.log("Could not remove" + error);
                    res.redirect(storyItemView + storyId);

                }
            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(storyItemView + storyId);

        })

    } else {
        res.redirect('/');
    }

});

app.post('/storyitem/change/sticker/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let stickerId = req.body.sticker_id;
    let sticker_url = req.body.sticker_url;
    let storyId;
    let storyItemView = '/storyitem/view/';

    if (token) {

        getUser(token).then(function (sessionToken) {

            console.log(" STORYITEM 2 " + id);

            return new Parse.Query(_class.StoryItems).equalTo("objectId", id).first();

        }).then(function (storyItem) {

            console.log("STORY ITEM " + JSON.stringify(storyItem));

            storyId = storyItem.get("storyId");

            storyItem.set("type", type.STORY_ITEM.sticker);
            storyItem.set("contents", {"id": stickerId, "uri": sticker_url});

            return storyItem.save();

        }).then(function () {

            res.redirect(storyItemView + storyId);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect(storyItemView + storyId);

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

            return new Parse.Query(_class.Stickers).limit(PARSE_LIMIT).find();
            // return new Parse.Query(_class.Stories).equalTo("objectId", storyId).first();
            //
            // }).then(function (story) {
            //
            //     return new Parse.Query(_class.Packs).equalTo("objectId", story.get("packId")).first();
            //
            // }).then(function (pack) {
            //
            //     let col = pack.relation(_class.Packs);
            //     return col.query().find();

        }).then(function (stickers) {

            res.render("pages/stories/change_catalogue_sticker", {
                storyItemId: storyItemId,
                stickers: stickers
            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/storyitem/view/' + storyId);
        })

    } else {

        res.redirect('/');

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

            res.render("pages/stories/edit_story_item", {
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
                    res.render("pages/categories/search_categories", {categories: category});
                } else {
                    console.log("MESSAGE FROM SEARCH " + category);
                    console.log("CATEGORY DETAILS " + JSON.stringify(category));
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


//SELECT CATEGORIES PAGE
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
    let categories = '/categories';

    if (token) {

        getUser(token).then(function (sessionToken) {

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
            res.render("pages/reviews/review_collection", {reviews: review});

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
    let packs = '/packs';

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs);

        }).then(function (pack) {

            pack.get(pack_id, {
                success: function (pack) {
                    let pack_name = pack.get("name");
                    let pack_owner = pack.get("userName");
                    let pack_owner_id = pack.get("userId");
                    let art = pack.get("artwork");
                    let pack_id = pack.id;
                    let _description = pack.get("description");

                    //
                    // new Parse.Query("User").equalTo("objectId", pack_owner).find().then(function (user) {
                    //     _owner = user;
                    //     console.log("ABOUT TO SEARCH FOR USER "+JSON.stringify(_owner));
                    // }, function (error) {
                    //     console.log("ERROR "+error.message);
                    // });

                    res.render("pages/reviews/review_page", {
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
                    res.redirect(packs);
                }

            });
        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect(packs);
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
                review.set("image", pack.get("artwork").url());
                review.set("name", pack.get("name"));
                review.set("owner", pack.get("userId"));
                review.set("packId", pack.id);
                return pack.save();

            }).then(function () {

                if (status === "2") {
                    review.set("approved", true);
                } else if (status === "1") {
                    review.set("approved", false);
                }
                review.set("comments", comment);
                review.set("reviewer", _user.id);
                review.set("reviewerName", _user.get("name"));
                review.set("typeId", id);
                review.set("reviewField", []);
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
                let id = review.get("typeId");
                return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();
            } else {
                res.render("pages/reviews/review_details", {reviews: review});
            }

        }).then(function (sticker) {
            let sticker_url = sticker.get("uri").url();
            res.render("pages/reviews/review_details", {reviews: _review, sticker_url: sticker_url});

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
    let field = req.body.reviewField;
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
                    sticker.set("flagged", true);
                } else if (status === "1") {
                    sticker.set("flagged", false);
                }
                reviews.set("image", sticker.get("uri").url());
                reviews.set("name", sticker.get("name"));
                reviews.set("owner", sticker.get("userId"));

                let _pack = sticker.get("parent");
                _pack.fetch({
                    success: function (_pack) {

                        reviews.set("packId", _pack.id);

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
                reviews.set("reviewerName", _user.get("name"));
                reviews.set("typeId", id);
                reviews.set("reviewField", review_field);

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

            res.render("pages/packs/packs_for_admin", {

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

    let token = req.cookies.token;

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            let query = new Parse.Query(_class.Packs);
            query.equalTo("userId", _user.id).ascending("createdAt").find({sessionToken: token}).then(function (collections) {

                res.render("pages/packs/packs", {
                    packs: collections,
                    type: type
                });
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

    let token = req.cookies.token;
    let pack_description = req.body.pack_description;
    let coll_name = req.body.coll_name;
    let packType = parseInt(req.body.packType);
    let version = parseInt(req.body.version);

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let PackCollection = new Parse.Object.extend(_class.Packs);
            let pack = new PackCollection();
            pack.set("name", coll_name);
            pack.set("description", pack_description);
            pack.set("userId", _user.id);
            pack.set("status", type.PACK_STATUS.pending);
            pack.set("version", version);
            pack.set("productId", "");
            pack.set("archived", false);
            pack.set("flagged", false);
            pack.set("published", false);

            if (packType === type.PACK_TYPE.grouped) {

                pack.set("packType", type.PACK_TYPE.grouped);

            } else if (packType === type.PACK_TYPE.themed) {

                pack.set("packType", type.PACK_TYPE.themed);

            } else if (packType === type.PACK_TYPE.curated) {

                pack.set("packType", type.PACK_TYPE.curated);

            }

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

    let is_published = false;
    let pack_art = false;

    if (token) {

        let _user = {};
        let userType;
        let pack_name;
        let pack_status;
        let page;
        let _stickers;
        let productId;

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            userType = _user.get("type");

            let query = new Parse.Query(_class.Packs).equalTo("objectId", pack_id);

            switch (userType) {
                case SUPER_USER:
                    return query.first({useMasterKey: true});

                case NORMAL_USER:
                    return query.first({sessionToken: token});

            }

        }).then(function (pack) {

            pack_status = pack.get("status");
            pack_art = pack.get("artwork");
            is_published = pack.get("published");
            pack_name = pack.get("name");
            packType = pack.get("packType");
            productId = pack.get("productId");

            let packRelation = pack.relation(_class.Packs);

            switch (userType) {
                case SUPER_USER:
                    return packRelation.query().limit(PARSE_LIMIT).ascending("name").find({useMasterKey: true});

                case NORMAL_USER:
                    return packRelation.query().find({sessionToken: token});

            }
        }).then(function (stickers) {

            _stickers = stickers;

            return Parse.Promise.when(
                new Parse.Query(_class.Packs).equalTo("userId", _user.id).find(),
                new Parse.Query(_class.Product).find(),
            );

        }).then(function (packs, products) {

            page = util.page(packs, pack_id);

            switch (userType) {
                case SUPER_USER:
                    res.render("pages/packs/admin_pack", {
                        stickers: _stickers,
                        id: pack_id,
                        art: pack_art,
                        published: is_published,
                        pack_name: pack_name,
                        userType: _user.get("type"),
                        status: pack_status,
                        next: page.next,
                        previous: page.previous,
                        pack_type: packType,
                        type: type,
                        productId: productId,
                        products: products
                    });
                    break;

                case NORMAL_USER:
                    res.render("pages/packs/new_pack", {
                        stickers: _stickers,
                        id: pack_id,
                        pack_name: pack_name,
                        art: pack_art,
                        published: is_published,
                        status: pack_status,
                        next: page.next,
                        previous: page.previous,
                        type: type,
                        productId: productId,
                        products: products
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

app.post('/pack/product', function (req, res) {

    let token = req.cookies.token;
    let packId = req.body.packId;
    let productId = req.body.productId;
    let zero = "0";

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", packId).first();

        }).then(function (pack) {

            if (productId === zero) {
                pack.set("productId", "free");
            } else {
                pack.set("productId", productId);
            }

            return pack.save();

        }).then(function (pack) {

            res.redirect('/pack/stickers/' + packId + '/' + pack.get("productId"));

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/pack/' + packId);
        })

    } else {
        res.redirect('/');
    }

});

app.post('/pack/product/update', function (req, res) {

    let token = req.cookies.token;
    let packId = req.body.packId;
    let productId = req.body.productId;
    let _stickers = [];

    console.log("PRODUCT ID " + productId);

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", packId).first();

        }).then(function (pack) {

            if (productId !== "free") {
                pack.set("productId", productId);
            } else {
                pack.set("productId", "free");
            }

            return pack.save();
        }).then(function (pack) {

            return new Parse.Query(_class.Stickers).equalTo("parent", {
                __type: 'Pointer',
                className: _class.Packs,
                objectId: packId
            }).find();

        }).then(function (stickers) {

            console.log("STICKERS " + JSON.stringify(stickers));

            _.each(stickers, function (sticker) {

                sticker.set("productId", productId);
                if (productId !== "free") {
                    sticker.set("sold", false);
                } else {
                    sticker.set("sold", true);
                }
                _stickers.push(sticker);

            });

            return Parse.Object.saveAll(_stickers);

        }).then(function (stickers) {

            res.redirect('/pack/edit/' + packId);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/pack/edit/' + packId);

        })
    } else {

        res.redirect('/');

    }

});

app.get('/pack/edit/:id', function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.params.id;
    let _pack;
    let _productId;
    let productDetails;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {
            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first(),
                new Parse.Query(_class.Product).equalTo("userId", _user.id).find()
            );

        }).then(function (pack, productId) {
            _pack = pack;
            _productId = productId;

            return new Parse.Query(_class.Product).equalTo("objectId", pack.get("productId")).first();

        }).then(function (productInfo) {
            console.log("HERE 2 " + productInfo);

            if (productInfo !== undefined) {
                productDetails = productInfo.get("name");
            }

            if (_pack.get("productId") === "free") {

                productDetails = "FREE";
            }

            res.render("pages/packs/pack_details", {
                pack_details: _pack,
                productId: _productId,
                productDetails: productDetails,
                type: type
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
    let packName = req.body.pack_name;
    let archive = req.body.archive;
    let packVersion = parseInt(req.body.packVersion);
    let productId = req.body.productId;
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

            if (files.length !== 0) {

                return util.thumbnail(files)

            } else {
                return true;
            }

        }).then(previews => {

            _previews = previews;

            return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

        }).then(function (pack) {

            console.log("PACK 1 " + JSON.stringify(pack))

            pack.set("description", description);
            pack.set("keywords", _keywords);
            pack.set("archived", archive);
            pack.set("productId", productId);
            pack.set("version", packVersion);
            if (packName !== undefined || packName !== "undefined") {
                pack.set("name", packName);
            }

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

                    pack.set("artwork", parseFile);
                    pack.set("preview", parseFilePreview);
                    fileDetails.push(file);

                });
            }

            return pack.save();

        }).then(function (pack) {

            console.log("PACK " + JSON.stringify(pack))
            _.each(fileDetails, function (file) {
                //Delete tmp fil after upload
                let tempFile = file.path;
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
    let reviewEdit = '/review/edit/';

    let key = keyword.split(",");

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(_class.Packs).equalTo("objectId", id).first();
        }).then(function (pack) {
            pack.set("name", name);

            if (archive === undefined || archive === "1") {
                pack.set("archived", false);
            } else if (archive === "0") {
                pack.set("archived", true);
            }
            pack.set("description", description);
            pack.set("keywords", key);

            return pack.save();

        }).then(function (result) {
            res.redirect(reviewEdit + review_id);
        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect(reviewEdit + review_id);
        });
    } else {
        res.redirect('/');
    }
});

app.get('/pack/review/update/status/:id', function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.params.id;
    let pack = '/pack/';

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            pack.set("status", type.PACK_STATUS.review);
            return pack.save();

        }).then(function () {

            console.log("PACK SUBMITTED FOR REVIEW");
            res.redirect(pack + pack_id);

        }, function (error) {

            console.log("PACK NOT SUBMITTED FOR REVIEW. ERROR " + error.message);
            res.redirect(pack + pack_id);

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
    let reviewEdit = '/review/edit/';
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

                let review_fields = review.get("reviewField");
                let review_field = Array.from(review_fields);

                for (let time = 0; time < review_field.length; time++) {
                    if (review_field[time] === "all") {
                        all = review_field[time];
                    } else if (review_field[time] === "name") {
                        name = review_field[time];
                    } else if (review_field[time] === "category") {
                        category = review_field[time];
                    } else if (review_field[time] === STICKER) {
                        sticker = review_field[time];
                    }
                }

                res.render("pages/stickers/edit_sticker", {
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
                res.redirect(reviewEdit + review_id);
            });
        } else {
            getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(_class.Packs).equalTo("objectId", id).first();

            }).then(function (pack) {

                res.render("pages/packs/edit_pack", {pack: pack, review_id: review_id});

            }, function (error) {

                console.log("ERROR " + error.message);
                res.redirect(reviewEdit + review_id);

            });
        }
    } else {
        res.redirect('/')
    }

});

app.get('/pack/stickers/remove/:stickerId/:packId', function (req, res) {

    let token = req.cookies.token;
    let stickerId = req.params.stickerId;
    let packId = req.params.packId;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first(),
                new Parse.Query(_class.Packs).equalTo("objectId", packId).first()
            )
        }).then(function (sticker, pack) {

            let collection_relation = pack.relation(_class.Packs);
            collection_relation.remove(sticker);

            return pack.save();

        }).then(function () {

            res.redirect('/pack/' + packId);

        }, function (error) {

            console.log("ERROR REMOVING STICKER RELATION " + error.message);
            res.redirect('/pack/' + packId);

        })
    } else {
        res.redirect('/');
    }

});

app.post('/pack/stickers/:packId', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.packId;
    let stickerIds = req.body.stickerIds;
    let _stickerIds = [];

    console.log("STICKERS " + stickerIds);
    _stickerIds = stickerIds.split(",");
    console.log("STICKERS " + _stickerIds);

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).containedIn("objectId", _stickerIds).find(),
                new Parse.Query(_class.Packs).equalTo("objectId", id).first()
            )

        }).then(function (stickers, pack) {

            console.log("STICKERS " + JSON.stringify(stickers));
            _.each(stickers, function (sticker) {
                let collection_relation = pack.relation(_class.Packs);
                collection_relation.add(sticker);
            });

            return pack.save();

        }).then(function (pack) {

            res.redirect('/pack/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/pack/' + id);

        })

    } else {
        res.redirect('/');
    }
});

app.get('/pack/stickers/:packId/:productId', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.packId;
    let productId = req.params.productId;
    let free = [];
    let paid = [];

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            // return new Parse.Query(_class.Packs).equalTo("objectId", id).first();
            return new Parse.Query(_class.Packs).equalTo("packType", type.PACK_TYPE.grouped).find();

        }).then(function (packs) {

            let _stickers = [];

            _.each(packs, function (pack) {

                _stickers.push(pack.id);

            });

            return new Parse.Query(_class.Stickers).containedIn("parent", _stickers).find();

        }).then(function (stickers) {

            if (productId === "free") {
                _.each(stickers, function (sticker) {

                    if (sticker.get("sold") === false) {

                        free.push(sticker);

                    }
                });
            } else if (productId !== "free") {
                _.each(stickers, function (sticker) {

                    if (sticker.get("sold") === true) {

                        paid.push(sticker);

                    }
                });
            }
            res.render("pages/packs/select_stickers", {
                id: id,
                freeStickers: free,
                paidStickers: paid

            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/pack/' + id);
        })

    } else {
        res.redirect('/');
    }
});

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
                    res.redirect(pack + id);
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

// Add Stickers Version 1
app.get('/uploads/computer/:id', function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {
        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first();

        }).then(function (pack) {

            res.render("pages/stickers/add_sticker", {id: pack.id, pack_name: pack.get("name")});

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
    let stickerCollection = {};
    let _previews = [];
    let pack = "/pack/";

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            //TODO implement DRY for thumbnails
            util.thumbnail(files).then(previews => {

                _previews = previews;

                return new Parse.Query(_class.Packs).equalTo("objectId", pack_id).first({sessionToken: token});

            }).then(function (pack) {

                stickerCollection = pack;

                files.forEach(function (file) {

                    let Sticker = new Parse.Object.extend(_class.Stickers);
                    let sticker = new Sticker();


                   // fullName = fullName.replace(util.SPECIAL_CHARACTERS, '');
                    let originalName = file.originalname;
                    let stickerName = originalName.replace(util.SPECIAL_CHARACTERS, '').
                    substring(0, originalName.length - 4);

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
                    sticker.set("name", stickerName);
                    sticker.set("localName", stickerName);
                    sticker.set("uri", parseFile);
                    sticker.set("preview", parseFilePreview);
                    sticker.set("userId", _user.id);
                    sticker.set("parent", pack);
                    sticker.set("description", "");
                    sticker.set("meaning", "");
                    sticker.set("flagged", false);
                    sticker.set("archived", false);
                    if (pack.get("productId") !== "") {
                        sticker.set("sold", true);
                        sticker.set("productId", pack.get("productId"));
                    } else {
                        sticker.set("sold", false);
                        sticker.set("productId", "");
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
                        console.log("BIG BIG ERROR: " + error.message);
                    }
                    else {

                        console.log("EMAIL SENT" + body);
                    }
                });

                // statsRef.transaction(function (sticker) {
                //     if (sticker) {
                //         if (sticker.stickers) {
                //             sticker.stickers++;
                //         }
                //     }
                //
                //     return sticker
                // });

                return stickerCollection.save();

            }).then(function (stickers) {

                res.redirect(pack + pack_id);

            }, function (error) {

                console.log("BIG BIG ERROR" + JSON.stringify(error));
                res.redirect(pack + pack_id);

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
                let tempFile = file.path;
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
    let _latest = "";
    let _page;


    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first(),
                new Parse.Query(_class.Categories).ascending("name").find(),
                new Parse.Query(_class.Packs).equalTo("objectId", packId).first(),
                new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first()
            );

        }).then(function (sticker, categories, pack, latest) {

            _sticker = sticker;
            _categories = categories;
            _pack = pack;

            if (latest) {
                _latest = latest;
            }

            selectedCategories = sticker.get("categories");

            console.log("SELECTED " + latest);

            let sticker_relation = sticker.relation(_class.Categories);
            return sticker_relation.query().find();

        }).then(function (stickerCategories) {

            // var categoryNames = [];
            // _.each(stickerCategories, function (category) {
            //     categoryNames.push(category.get("name"))
            // });

            // console.log("CATEGORY NAMES " + categoryNames);

            // if (_user.get("type") === SUPER_USER) {
            //     res.render("pages/reviews/admin_details", {
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

            // const s3 = new AWS.S3();
            //
            // AWS.config.region = 'us-east-1'; // Region
            // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            //     IdentityPoolId: 'us-east-1:3040d86e-7139-4023-b6d6-d84b37b220e6',
            // });
            //
            // const myBucket = 'cyfa';
            // let name = _sticker.get("uri").name();
            //
            // console.log("NAME " + name);
            //
            // const key = name;
            // const signedUrlExpireSeconds = 60 * 5;
            //
            // s3.getSignedUrl('getObject', {
            //     Bucket: myBucket,
            //     Key: key,
            //     Expires: signedUrlExpireSeconds
            // }, function (error, url) {
            //     if (error){
            //         console.log("ERROR S3", error.message);
            //
            //     }else {
            //         // res.redirect(url);
            //         console.log("The URL is", url);
            //
            //     }
            // });

            let col = _pack.relation(_class.Packs);
            return col.query().find({sessionToken: token});

        }).then(function (stickers) {

            _page = util.page(stickers, stickerId);

            res.render("pages/stickers/sticker_details", {
                sticker: _sticker,
                selected: selectedCategories,
                categories: _categories,
                pack_id: packId,
                next: _page.next,
                previous: _page.previous,
                // uri: url,
                id: stickerId,
                latest: _latest
            });
        }, function (error) {
            console.log("Error Loading-----------------------" + error.messgae);
            res.redirect("/pack/" + packId);

        });
    }
    else {
        res.redirect("/");
    }
});

//Update Sticker
app.post('/sticker/edit/:stickerId/:packId', function (req, res) {

    let token = req.cookies.token;

    //input fields from form
    let stickerName = req.body.stickerName;
    // let localName = req.body.localName;
    let new_categories = req.body.categories;
    let stickerId = req.params.stickerId;
    let packId = req.params.packId;
    let sticker_status = req.body.sticker_status;
    let meaning = req.body.meaning;
    let description = req.body.description;
    let stickerEdit = "/sticker/edit/";

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

            sticker.set("name", stickerName);
            sticker.set("localName", stickerName);
            sticker.set("categories", _listee);
            sticker.set("meaning", meaning);
            if (sticker_status === "1") {
                sticker.set("sold", true);
            } else if (sticker_status === "0") {
                sticker.set("sold", false);
            }
            sticker.set("description", description);

            return sticker.save();

        }).then(function (sticker) {

            console.log("STICKER UPDATED" + JSON.stringify(sticker));
            res.redirect(stickerEdit + stickerId + "/" + packId);

        }, function (error) {

            console.log("SERVER ERROR " + error.message);
            res.redirect(stickerEdit + stickerId + "/" + packId);

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

            res.render("pages/stickers/upload", {id: pack_id, pack_name: pack.get("name")});


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
    let pack = "/pack/";

    name = req.body.fileName;
    fileUrl = req.body.fileUrl; // receive url from form
    name = name.substring(0, name.length - 4);

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            let options = {
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

                            sticker.set("name", name);
                            sticker.set("localName", name);
                            sticker.set("userId", _user.id);
                            sticker.set("uri", parseFile);
                            sticker.set("parent", pack);
                            sticker.set("flagged", false);
                            sticker.set("archived", false);
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
                        res.redirect(pack + pack_id);

                    }, function (error) {
                        console.log("BIG BIG ERROR" + error.message);
                        res.redirect(pack + pack_id);
                    });
                }).catch((err) => {
                throw err;
            });
        }, function (error) {
            console.log("SESSION INVALID " + error.message);
            res.redirect(pack + pack_id);
        });

    } else {

        res.redirect(pack + pack_id);

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

            res.render("pages/categories/associated_stickers", {
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
    let pack = "/pack/";


    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();

        }).then(function (_sticker) {
                _sticker.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        res.redirect(pack + pack_id);
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                        res.redirect(pack + pack_id);

                    }
                });
            },
            function (error) {
                console.error(error);
                res.redirect(pack + pack_id);

            });
    } else {
        res.redirect('/');
    }

});

app.post('/sticker/decsription/:id', function (req, res) {

    let token = req.cookies.token;
    let stickerId = req.params.id;
    let description = req.body.description;
    let origin = req.body.origin;
    let sticker = 'sticker';

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(_class.Stickers).equalTo("objectId", stickerId).first();

        }).then(function (sticker) {

            sticker.set("description", description);

            return sticker.save();

        }).then(function () {

            // res.redirect(home);
            res.redirect('/notification/' + stickerId + '/' + sticker + '/' + origin);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/');

        })
    }

});


/*====================================== STICKERS ============================*/


/*====================================== PRODUCT ID ============================*/

app.get('/products', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {

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

        getUser(token).then(function (sessionToken) {

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

    console.log("NAME " + name + " DESC " + description);

    if (token) {

        getUser(token).then(function (sessionToken) {

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

        console.log("PREVIEW 2 " + android_price + " AND " + ios_price);

        if (token) {

            getUser(token).then(function (sessionToken) {

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
    }
);

app.get('/product/edit/:productId', function (req, res) {

    let token = req.cookies.token;
    let productId = req.params.productId;

    if (token) {

        getUser(token).then(function (sessionToken) {

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
/*====================================== PRODUCT ID ============================*/


/*====================================== FEED ============================*/

app.post('/feeds/:type/:origin', function (req, res) {

    let token = req.cookies.token;
    let feedType = req.params.type;
    let origin = req.params.origin;
    let id = req.body.element_id;
    let storyPage = "story";

    if (token) {

        getUser(token).then(function (sessionToken) {
            switch (feedType) {
                case STICKER:
                    return new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STICKER).first();

                case STORIES:
                    return new Parse.Query(_class.Latest).equalTo("objectId", process.env.LATEST_STORY).first();

            }

        }).then(function (latest) {

            latest.set("feedId", id);

            return latest.save();

        }).then(function () {

            let Selected = new Parse.Object.extend(_class.History);
            let selected = new Selected();

            switch (feedType) {
                case STICKER:
                    selected.set("type", 0);
                    selected.set("itemId", id);
                    break;
                case STORIES:
                    selected.set("type", 1);
                    selected.set("itemId", id);
                    break;
            }

            return selected.save();

        }).then(function () {

            switch (feedType) {
                case STICKER:
                    return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();
                case STORIES:
                    if (origin === storyPage) {
                        res.redirect('/notification/' + id + '/' + feedType + '/' + origin);

                        // res.redirect('/storyedit/' + id);
                    } else {

                        // res.redirect('/home');
                        res.redirect('/notification/' + id + '/' + feedType + '/' + origin);
                    }
            }

        }).then(function (sticker) {

            if (sticker.get("description") === "" || sticker.get("description") === undefined) {
                res.render("pages/stickers/add_description", {
                    sticker: sticker,
                    origin: origin
                })
            } else {
                res.redirect('/notification/' + id + '/' + feedType + '/' + origin);

                // res.redirect('/home');
            }

        }, function (error) {

            console.log("ERROR " + error.message);
            switch (feedType) {
                case STICKER:
                    res.redirect('/feed/sticker');
                    break;

                case STORIES:
                    res.redirect('/feed/story');
                    break;
            }

        });
    } else {

        res.redirect('/');

    }

});

app.get('/notification/:id/:type/:origin', function (req, res) {

    let token = req.cookies.token;
    let notificationType = req.params.type;
    let id = req.params.id;
    let origin = req.params.origin;
    let storyPage = "story";
    let _story = {};

    if (token) {

        getUser(token).then(function (sessionToken) {
            switch (notificationType) {
                case STORIES:
                    return Parse.Promise.when(
                        new Parse.Query(_class.Stories).equalTo("objectId", id).first(),
                        new Parse.Query(_class.ArtWork).equalTo("itemId", id).first()
                    );

                case STICKER:
                    return new Parse.Query(_class.Stickers).equalTo("objectId", id).first();

            }
        }).then(function (item, artwork) {

            console.log("ARTWORK " + artwork);
            switch (notificationType) {
                case STORIES:
                    _story = item;
                    return new Parse.Query(_class.Stickers).equalTo("objectId", artwork.get("stickerId")).first();

                case STICKER:
                    return item;
            }
        }).then(function (sticker) {

            switch (notificationType) {
                case STORIES:
                    let story = create.Story(_story);
                    story = create.StoryArtwork(story, sticker);
                    notification.send({
                        title: "AM I FAT",
                        description: "So, yesterday, someone actually called me fat. Yes, a whole me, FAT! Hmmm…! I am coming, let me gather myself because the way my heart is beating, I might say something and it will become something that is there. So you, it’s okay",
                        activity: "STORY_ACTIVITY",
                        data: {
                            id: "q7qeqHtU38",
                            title: "AM I FAT",
                            stickerUrl: "https://cyfa.s3.amazonaws.com/d8afeb64ae4f4ef0e9a29c81b2289413_angry%20face.png",
                            summary: "So, yesterday, someone actually called me fat. Yes, a whole me, FAT! Hmmm…! I am coming, let me gather myself because the way my heart is beating, I might say something and it will become something that is there. So you, it’s okay.",
                            topColor: "#17BBFF",
                            bottomColor: "#7C3FD9"
                        },
                        //TODO retrieve first section from Server
                        topic: "test.feed.story"
                    }).then(function (success) {

                        console.log("SENDING WAS SUCCESSFUL " + JSON.stringify(success));

                    }, function (status) {
                        console.log("STATUS " + status);

                    });
                    if (origin === storyPage) {
                        res.redirect('/storyedit/' + id);
                    } else {
                        res.redirect('/home');
                    }
                    break;

                case STICKER:
                    let _sticker = create.Sticker(sticker);
                    notification.send({
                        title: "Sticker Of the Day",
                        description: "agye gon - What a sad outcome",
                        activity: "STICKER_ACTIVITY",
                        data: {
                            id: "GaY7fNmUss",
                            name: "agye gon",
                            description: "What a sad outcome",
                            url: "https://cyfa.s3.amazonaws.com/76148e8c2f16f2e5d613d21469e55418_agye%20gon.png"
                        },
                        //TODO retrieve first section from Server
                        topic: "test.feed.sticker"
                    }).then(function (success) {

                        console.log("SENDING WAS SUCCESSFUL " + JSON.stringify(success));

                    }, function (status) {
                        console.log("STATUS " + status);

                    });

                    res.redirect('/home');
                    break;
            }
        })
    } else {
        res.redirect('/');
    }

    //TODO type by id

});

app.get('/feed/sticker', function (req, res) {

    let token = req.cookies.token;
    let _user = {};

    if (token) {

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let query = new Parse.Query(_class.Stickers);
            query.equalTo("sold", false);
            query.equalTo("userId", _user.id);
            return query.find();

        }).then(function (stickers) {

            res.render("pages/stickers/sticker_of_day", {
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
                new Parse.Query(_class.Stories).equalTo("userId", _user.id).find(),
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

                    artWork.push(artwork.get("stickerId"));

                });

                return new Parse.Query(_class.Stickers).containedIn("objectId", artWork).find();
            } else {
                res.render("pages/stories/story_of_day", {

                    stories: [],
                    artworks: []

                });
            }

        }).then(function (stickers) {

            _.each(_allArtwork, function (artworks) {

                _.each(stickers, function (sticker) {

                    if (artworks.get("sticker") === sticker.id) {

                        combined.push({
                            story: artworks.get("itemId"),
                            image: sticker.get("uri").url()
                        });
                    }
                })
            });

            res.render("pages/stories/story_of_day", {

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

    let storyId = req.params.storyId;
    let _story;
    let colors;

    Parse.Promise.when(
        new Parse.Query(_class.Stories).equalTo("objectId", storyId).first(),
        new Parse.Query(_class.ArtWork).equalTo("itemId", storyId).first()
    ).then(function (story, sticker) {

        _story = story;

        colors = story.get("color");

        if (!colors) {
            //use system default
            colors = type.DEFAULT.colors;
        }

        return Parse.Promise.when(
            new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first(),
            new Parse.Query(_class.StoryItems).equalTo("storyId", _story.id).find()
        )

    }).then(function (sticker, storyItems) {

        res.render("pages/newsletter/newsletter", {
            story: _story,
            sticker: sticker,
            colors: colors,
            storyItems: storyItems,
            type: type
        });

    }, function (error) {
        console.log("ERROR " + error.message);
        res.redirect('/stories');
    })

});

app.post('/newsletter/email', function (req, res) {

    let email = req.body.email;

    function subscriptionTemplate(id) {

        let file = fs.readFileSync('./views/pages/newsletter/newsletter_email.ejs', 'ascii');

        return ejs.render(file, {id: id, serverURL: SERVER_URL});
    }

    if (email) {

        new Parse.Query(_class.NewsLetter).equalTo("email", email).first().then(function (newsletter) {

            if (newsletter) {
                if (newsletter.get("subscribe") === false) {

                    return subscriptionTemplate(newsletter.id);

                    // res.redirect('/newsletter/update/' + newsletter.id);

                } else if (newsletter.get("subscribe") === true) {

                    res.render("pages/newsletter/newsletter_already_subscribed");

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

            res.render("pages/newsletter/newsletter_subscribe");

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
        res.render("pages/newsletter/newsletter_updates");

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
        new Parse.Query(_class.ArtWork).equalTo("itemId", 'VcTBweB2Mz').first()
    ).then(function (newsletters, story, sticker) {

        console.log("COLLECTED ALL DATA");

        _newsletters = newsletters;
        _story = story;

        colors = story.get("color");
        if (!colors) {
            //use system default
            colors = type.DEFAULT.colors;
        }

        return Parse.Promise.when(
            new Parse.Query(_class.Stickers).equalTo("objectId", sticker.get("stickerId")).first(),
            new Parse.Query(_class.StoryItems).equalTo("storyId", _story.id).find()
        )

    }).then(function (sticker, storyItems) {

        _.each(_newsletters, function (newsletter) {

            emails.push(newsletter.get("email"));

        });

        let file = fs.readFileSync('./views/pages/newsletter/newsletter_story.ejs', 'ascii');

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

            res.render("pages/stickers/testupload", {id: pack.id, pack_name: pack.get("name")});

        })
    }
});

app.get('/firebase', function (req, res) {

    let db = admin.database();

    let ref = db.ref("sticker");

    let statsRef = ref.child("tkpa8O1NBG" + "/views/count");

    statsRef.transaction(function (count) {

        count += 1;
        return count
        // return sticker
    }).then(function (count) {

        res.send("COUNT " + count)

    }, function (error) {
        res.send("ERROR " + error.message)
    })
});

app.get('/firebase_count', function (req, res) {

    let db = admin.database();

    let ref = db.ref("sticker");

    let statsRef = ref.child("tkpa8O1NBG" + "/views/count");

    statsRef.transaction(function (count) {

        return count;
        // return sticker
    }).then(function (count) {

        res.send("COUNT " + JSON.stringify(count))

    }, function (error) {
        res.send("ERROR " + JSON.stringify(error))
    })
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
