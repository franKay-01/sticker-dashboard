let express = require('express');
let ParseServer = require('parse-server').ParseServer;
var S3Adapter = require('@parse/s3-files-adapter');
let SimpleSendGridAdapter = require('parse-server-sendgrid-adapter');
let path = require('path');
let cors = require('cors');
let Parse = require("parse/node").Parse; // import the module
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
let fs = require('fs');
let multer = require('multer');
let _ = require('underscore');
let helper = require('./cloud/modules/helpers');
let methodOverride = require('method-override');
let download = require('image-downloader');
let resolve = require('path').resolve;

let config = require('./config.json');
// let download = require('images-downloader').images;

var errorMessage = "";
var searchErrorMessage = "";

//TODO use vars for class names
//TODO change class names to make it more appropriate
let CollectionClass = "Collection";
let StickerClass = "Stickers";
let CategoryClass = "Categories";
let PacksClass = "Packs";
let ReviewClass = "Reviews";

let PENDING = 0;
let REVIEW = 1;
let APPROVED = 2;

// let PacksClass = "Packss";
let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// let databaseUri = config.DATABASE_URI; //for google

Parse.initialize("d55f9778-9269-40c2-84a2-e0caaf2ad87a");
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';

/* for google
// Parse.initialize(config.APP_ID);
// Parse.serverURL = config.SERVER_URL;
*/

// console.log("DATABASE "+config.DATABASE_URI);

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
}


var api = new ParseServer({
    //**** General Settings ****//

    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
    // serverURL: config.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed

    //**** Security Settings ****//
    // allowClientClassCreation: process.env.CLIENT_CLASS_CREATION || false,

    appId: process.env.APP_ID || 'myAppId', //For heroku
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
    //TODO add append parse if necessary
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
        invalidLink: 'http://cryptic-waters-41617.herokuapp.com/public/templates/invalid_link.html',
        verifyEmailSuccess: 'http://cryptic-waters-41617.herokuapp.com/public/templates/email_verified.html',
        choosePassword: 'http://cryptic-waters-41617.herokuapp.com/public/templates/choose_password.html',
        passwordResetSuccess: 'http://cryptic-waters-41617.herokuapp.com/public/templates/password_reset_success.html'
    }


    // emailAdapter: SimpleSendGridAdapter({
    //     apiKey: process.env.SENDGRID_API_KEY || "apikey",
    //     fromAddress: process.env.EMAIL_FROM || "test@example.com"
    // })

    //**** File Storage ****//
    /*filesAdapter: new S3Adapter(
        "AKIAIK4H65MXJJMO7Q6A",
        "A85CCq3+X8c7pBHg6EOdvIL3YzPuvNyPwG8wvyNK",
        "cyfa",
        {
            directAccess: true
        }
    )*/,
    filesAdapter:
        new S3Adapter({
            bucket: "cyfa",
            directAccess: true
        })
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey


var app = express();

app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());   // Middleware for reading request body
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(methodOverride());


app.use(cookieSession({
    name: "session",
    secret: "A85CCq3+X8c7pBHg6EOdvIL3YzPuvNyPwG8wvyNK",
    maxAge: 15724800000
}));
// app.use(cookieParser("A85CCq3+X8c7pBHg6EOdvIL3YzPuvNyPwG8wvyNK"));


// set a cookie
app.use(function (req, res, next) {
    // check if client sent cookie
    var cookie = req.cookies.cookieName;
    if (cookie === undefined) {
        // no: set a new cookie
        var randomNumber = Math.random().toString();
        randomNumber = randomNumber.substring(2, randomNumber.length);
        res.cookie('cookieName', randomNumber, {maxAge: 900000, httpOnly: true});
        console.log('cookie created successfully');
        console.log("COOKIE " + randomNumber);
    }
    else {
        // yes, cookie was already present
        console.log('cookie exists', cookie);
    }
    next(); // <-- important!
});


app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.all('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
app.set('view engine', 'ejs');

//uploaded file storage location
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("Dest " + JSON.stringify(file));
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({storage: storage});
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Home Page
app.get('/', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {
        res.redirect("/home");
    } else {
        //retrieve stickers to randomly display on the home page
        new Parse.Query("Stickers").limit(40).find({sessionToken: token}).then(function (cards) {

            cards = helper.shuffle(cards);

            //render 3 stickers on the page
            cards = cards.slice(0, 3);

            if (errorMessage === "") {
                res.render("pages/login", {stickers: cards, error: []});

            } else {

                res.render("pages/login", {stickers: cards, error: errorMessage});

            }

        }, function (error) {

            res.render("pages/login", {stickers: []});

        });
    }
});

app.get('/sign_up', function (req, res) {
    var message = "";
    res.render("pages/sign_up", {error: message});
});

app.post('/signup', function (req, res) {
    var name = req.body.name_field;
    var username = req.body.username;
    var password = req.body.password;

    var user = new Parse.User();
    user.set("name", name);
    user.set("username", username);
    user.set("password", password);
    user.set("email", username);
    user.set("type", 2);
    user.set("image_set", false);
    user.set("facebook_handle", "");
    user.set("twitter_handle", "");
    user.set("instagram_handle", "");

    user.signUp(null, {
        success: function (user) {
            res.cookie('username', user.getUsername());
            res.cookie('name', user.get("name"));

            Parse.User.logIn(username, password).then(function (user) {
                console.log("SESSIONS TOKEN " + user.getSessionToken());
                res.cookie('token', user.getSessionToken());
                res.cookie('username', user.getUsername());
                res.cookie('name', user.get("name"));
                res.cookie('email_verified', user.get("emailVerified"));
                res.cookie('userType', user.get("type"));
                var status = user.get("image_set");
                if (status === true) {
                    res.cookie('profile_image', user.get("image").url());
                } else {
                    res.cookie('profile_image', "null");
                }

                req.session.token = user.getSessionToken();
                console.log("USER GETS TOKEN : " + user.getSessionToken());
                res.redirect("/home");
            });
        },
        error: function (user, error) {
            // Show the error message somewhere and let the user try again.
            var message = "SignUp was unsuccessful. " + error.message;
            res.render("pages/sign_up", {error: message});
        }
    });


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

        var userType = user.get("type");
        console.log("USER TYPE "+userType);
        req.session.token = user.getSessionToken();

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

        if (userType === 2) {
            res.redirect("/home");
        } else if (userType === 0) {
            res.redirect("/admin_home");
        }


    }, function (error) {
        //TODO render error message
        //TODO handle errors
        console.log("ERROR WHEN LOGGIN IN " + error);
        errorMessage = error.message;
        res.redirect("/");

    });
});

app.get('/admin_home', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var username = req.cookies.username;
    var name = req.cookies.name;
    var isVerified = req.cookies.email_verified;

    if (session && token) {

        username = username.substring(0, username.indexOf('@'));

        Parse.Promise.when(
            new Parse.Query(PacksClass).notEqualTo("status",PENDING).find(),
            new Parse.Query(CategoryClass).find(),
            //count all objects
            //TODO have a stats class
            new Parse.Query(CategoryClass).count(),
            new Parse.Query(PacksClass).count(),
            new Parse.Query(StickerClass).count()
        ).then(function (collection, categories, categoryLength, packLength, stickerLength) {

            let _collection = [];
            let _categories = [];

            if (collection.length) {
                _collection = collection;
                console.log("PACK INFO "+JSON.stringify(_collection));
            }

            if (categories.length) {
                _categories = categories;

            }

            Parse.Cloud.run("stickerNumber").then(function () {
            });

            res.render("pages/admin_home", {
                collections: _collection,
                categories: _categories,
                categoryLength: helper.leadingZero(categoryLength),
                packLength: helper.leadingZero(packLength),
                stickerLength: helper.leadingZero(stickerLength),
                username: username,
                user_name: name,
                verified: isVerified
            });

        }, function (error) {
            //TODO how to display error on home page
            console.log(JSON.stringify(error));
            res.redirect("/home");
        });

    } else {
        res.redirect("/");
    }
});

app.get('/home', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var username = req.cookies.username;
    var name = req.cookies.name;
    var user_info = req.cookies.userId;
    var isVerified = req.cookies.email_verified;

    console.log("EMAIL VERIFIED " + isVerified);
    if (session && token) {

        // new Parse.Query('_Session')
        //     .equalTo('sessionToken', token)
        //     .include('user').first().then(function (user) {
        //     console.log("SESSION DATA: "+JSON.stringify(user));
        // }, function (error) {
        //     console.log("SESSION DATA ERROR: "+JSON.stringify(error));
        // });

        username = username.substring(0, username.indexOf('@'));
        const limit = 3;

        Parse.Promise.when(
            new Parse.Query(PacksClass).equalTo("user_id", user_info).limit(limit).find(),
            new Parse.Query(CategoryClass).limit(limit).find(),
            //count all objects
            //TODO have a stats class
            new Parse.Query(CategoryClass).count(),
            new Parse.Query(PacksClass).count(),
            new Parse.Query(StickerClass).count()
        ).then(function (collection, categories, categoryLength, packLength, stickerLength) {

            let _collection = [];
            let _categories = [];

            if (collection.length) {
                _collection = collection;

            }

            if (categories.length) {
                _categories = categories;

            }

            Parse.Cloud.run("stickerNumber").then(function () {
            });

            res.render("pages/home", {
                collections: _collection,
                categories: _categories,
                categoryLength: helper.leadingZero(categoryLength),
                packLength: helper.leadingZero(packLength),
                stickerLength: helper.leadingZero(stickerLength),
                username: username,
                user_name: name,
                verified: isVerified
            });

        }, function (error) {
            //TODO how to display error on home page
            console.log(JSON.stringify(error));
            res.redirect("/home");
        });

    } else {
        res.redirect("/");
    }
});

app.get('/forget_password', function (req, res) {
    res.render("pages/forgot_password");
});


app.post('/reset_password', function (req, res) {
    var username = req.body.forgotten_password;

    Parse.User.requestPasswordReset(username, {
        success: function () {
            // Password reset request was sent successfully
            console.log("EMAIL was sent successfully");
            res.render("pages/password_reset_info");
        },
        error: function (error) {
            // Show the error message somewhere
            console.log("Error: " + error.code + " " + error.message);
            res.redirect('/forget_password');
        }
    });
});

app.get('/reset_email', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var user_info = req.cookies.userId;

    if (session && token) {
        new Parse.Query("User").equalTo("objectId", user_info).find().then(function (user) {
            console.log("USER FROM RESET " + JSON.stringify(user) + " CURRENT USER " + Parse.User.current());
            user.set("email", "test@gmail.com");
            user.set("username", "test@gmail.com");
            return user.save();
        }).then(function (result) {
            console.log("EMAIL CHANGED SUCCESSFULLY " + JSON.stringify(result));
            res.redirect("/");
        }, function (error) {
            console.log("EMAIL NOT CHANGED " + error.message);
            res.redirect("/");
        })
    }

});

//UPLOAD MULTIPLE STICKERS
app.post('/uploads', upload.array('im1[]'), function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    //TODO from coll_id to collectionId in the ejs file
    var collectionId = req.body.coll_id;
    var files = req.files;
    var fileDetails = [];
    var stickerDetails = [];
    var stickerCollection;

    if (session && token) {

        //TODO remove unused logs
        new Parse.Query(PacksClass).equalTo("objectId", collectionId).first({sessionToken: token}).then(function (collection) {

            console.log("INSIDE COLLECTION");
            stickerCollection = collection;

            files.forEach(function (file) {

                var fullName = file.originalname;
                var stickerName = fullName.substring(0, fullName.length - 4);

                var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
                // console.log("BITMAP FROM DERRYCK'S CODE " + JSON.stringify(bitmap));
                //create our parse file
                var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                // console.log("PARSEFILE " + JSON.stringify(parseFile) + " name " + stickerName + " collection " + JSON.stringify(collection));
                var Sticker = new Parse.Object.extend(StickerClass);
                var sticker = new Sticker();
                sticker.set("stickerName", stickerName);
                sticker.set("localName", stickerName);
                sticker.set("uri", parseFile);
                sticker.set("parent", collection);

                stickerDetails.push(sticker);
                fileDetails.push(file);

            });

            console.log("SAVE ALL OBJECTS AND FILE");
            return Parse.Object.saveAll(stickerDetails);

        }).then(function (stickers) {

            _.each(fileDetails, function (file) {
                //Delete tmp fil after upload
                var tempFile = file.path;
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
                var collection_relation = stickerCollection.relation(PacksClass);
                collection_relation.add(sticker);
            });

            console.log("SAVE COLLECTION RELATION");
            return stickerCollection.save();

        }).then(function () {

            console.log("REDIRECT TO PACK COLLECTION");
            res.redirect("/pack/" + collectionId);

        }, function (error) {
            console.log("BIG BIG ERROR" + error.message);
            res.redirect("/add_stickers");
        });


    } else {

        res.redirect("/");

    }
});

//TODO update all route names to read name-name or name
// FIND A SPECIFIC CATEGORY
app.post('/find_category', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var categoryName = req.body.searchCategory;

    if (session && token) {

        var searchCategory = new Parse.Query(CategoryClass);
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
        res.redirect("/categories");
    }
});

//SELECT CATEGORIES PAGE
app.get('/categories', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {

        new Parse.Query(CategoryClass).find({sessionToken: token}).then(function (categories) {

                let _categories = helper.chunks(categories, 4);

                res.render("pages/categories", {categories: _categories});
            },
            function (error) {
                console.log("No categories found.............." + JSON.stringify(error));
            });
    } else {
        res.redirect("/");
    }
});

app.post('/new_category', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    //TODO update naming conventions
    var categoryName = req.body.catname;

    if (session && token) {

        var Category = new Parse.Object.extend(CategoryClass);
        var categoryObject = new Category();

        categoryObject.set("name", categoryName);
        categoryObject.save().then(function () {

                res.redirect("/categories");
            },
            function (error) {
                console.log("Not created" + error);
                res.redirect("/");
            });
    }
    else {
        res.redirect("/");
    }
});

app.post('/review_pack/:id', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var pack_id = req.params.id;
    var reviewer = req.cookies.userId;
    var comment = req.body.review_text;
    var status = req.body.approved;

    console.log("COMMENT " + comment + " STATUS " + status);
    if (session && token) {
        var Reviews = new Parse.Object.extend(ReviewClass);
        var review = new Reviews();

        new Parse.Query(PacksClass).equalTo("objectId", pack_id).first().then(function (pack) {
            console.log("PACK FROM REVIEW " + JSON.stringify(pack));
            if (status === "2") {
                pack.set("status", APPROVED);
            } else if (status === "1") {
                pack.set("status", REVIEW);
            }

            review.set("pack_id", pack);
            return pack.save();

        }).then(function () {

            if (status === "2") {
                review.set("approved", true);
            } else if (status === 1) {
                pack.set("status", "1");
                review.set("approved", false);
            }
            review.set("comments", comment);
            review.set("reviewer", reviewer);

            return review.save();
        }).then(function () {
            console.log("PACK WAS SUCCESSFULLY REVIEWED");
            res.redirect('/pack/' + pack_id);
        }, function (error) {
            console.log("ERROR OCCURRED WHEN REVIEWING " + error.message)
            res.redirect('/review/' + pack_id);
        });
    }
});

app.get('/review/:id', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var pack_id = req.params.id;

    if (session && token) {
        var pack = new Parse.Query(PacksClass);
        pack.get(pack_id, {
            success: function (pack) {
                var pack_name = pack.get("pack_name");
                var pack_owner = pack.get("user_id");
                var art = pack.get("art_work");
                var _owner = [];

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
                    art_work: art
                });
            },
            error: function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/pack_collection');
            }

        });
    }
});

app.get('/user_profile', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var name = req.cookies.name;
    var username = req.cookies.username;
    var user_info = req.cookies.userId;
    var _profile = req.cookies.profile_image;

    console.log("IMAGE " + _profile);

    if (session && token) {
        new Parse.Query("User").equalTo("objectId", user_info).find({sessionToken: token}).then(function (user) {

            res.render("pages/profile", {username: name, email: username, profile: _profile});

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/');
        });

    }
});

app.post('/update_category', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var newName = req.body.catname;
    var currentId = req.body.categoryId;

    if (session && token) {

        var category = new Parse.Query("Categories");
        category.equalTo("objectId", currentId);
        category.first().then(function (category) {

                category.set("name", newName);
                return category.save();
            }
        ).then(function () {

                res.redirect("/categories");

            },
            function (error) {

                console.error(error);
            });
        console.log(currentId);
    }
    else { //no session found
        res.redirect("/");
    }

});

//This is to remove stickers
app.get('/delete_sticker/:id/:pid', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var removeId = req.params.id;
    var pageId = req.params.pid;


    if (session && token) {
        var sticker = new Parse.Query(StickerClass);
        sticker.equalTo("objectId", removeId);

        sticker.first().then(function (_sticker) {
                _sticker.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        res.redirect("/pack/" + pageId);
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                    }
                });
            },
            function (error) {
                console.error(error);
            });
    }

});

app.post('/remove_category', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var removeId = req.body.inputRemoveId;

    if (session && token) {

        console.log("Category_________: " + JSON.stringify(req.body));

        var category = new Parse.Query(CategoryClass);
        category.equalTo("objectId", removeId);
        category.first().then(function (category) {
                category.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        res.redirect("/categories");
                    },
                    error: function (error) {
                        console.log("Could not remove" + error);
                    }
                });
            },
            function (error) {
                console.error(error);
            });
    }
    else { //no session found
        res.redirect("/");
    }

});

//LOGOUT
app.get('/logout', function (req, res) {

    req.session = null;
    res.redirect("/");

});

// Dashboard
app.get('/dashboard', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    console.log("TOKEN RETRIEVED FROM BROWSER " + token);

    if (session && token) {

        new Parse.Query(StickerClass).find({sessionToken: token}).then(function (stickers) {

            res.render("pages/dashboard", {stickers: stickers});

        }, function (error) {

            console.log("dashboard error" + JSON.stringify(error));

        });

    }
    else {
        console.log("No Session Exists, log in");
        res.redirect("/");
    }

});

app.get('/second_dashboard', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {

        new Parse.Query(StickerClass).find({sessionToken: token}).then(function (stickers) {

            res.render("pages/dashboard", {stickers: stickers});

        }, function (error) {

            console.log("dashboard error" + JSON.stringify(error));

        });

    }
    else {
        console.log("No Session Exists, log in");
        res.redirect("/");
    }
});

// Collection Dashboard
app.get('/pack_collection', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var user_info = req.cookies.userId;

    if (session && token) {
        let query = new Parse.Query(PacksClass);
        query.equalTo("user_id", user_info).find({sessionToken: token}).then(function (collections) {

            res.render("pages/pack_collection", {collections: collections});

        }, function (error) {
            console.log("Colll error" + JSON.stringify(error));

        });

    }
    else {
        console.log("No Session Exists, log in");
        res.redirect("/");
    }
});


//Displays all stickers belonging to a selected collection
app.get('/pack/:id', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var coll_id = req.params.id;
    var user = req.cookies.userType;

    if (session && token) {
        var collection = new Parse.Query(PacksClass);
        collection.get(coll_id, {
            success: function (collection) {
                var coll_name = collection.get("pack_name");
                var pack_status = collection.get("status");
                //todo change the column 'collection' in Collection class to 'stickers' in parse dashboard

                var col = collection.relation(PacksClass);
                col.query().find().then(function (stickers) {

                    res.render("pages/new_pack", {
                        stickers: stickers,
                        id: coll_id,
                        collectionName: coll_name,
                        userType: user,
                        status: pack_status
                    });
                }, function (error) {
                    response.error("score lookup failed with error.code: " + error.code + " error.message: " + error.message);
                });
            }
        });


    }
    else {
        //No session exists, log in
        res.redirect("/");
    }

});


// Add Stickers Version 1
app.get('/add_stickers/:id/:pack_name', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var coll_id = req.params.id;
    var col_name = req.params.pack_name;

    if (session && token) {
        res.render("pages/add_sticker", {id: coll_id, coll_name: col_name});
    } else {
        res.redirect("/");
    }
});

app.get('/send_for_review/:id', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var pack_id = req.params.id;

    if (session && token){
        new Parse.Query(PacksClass).equalTo("objectId",pack_id).find().then(function (pack) {
            pack.set("status",REVIEW);
            return pack.save();
        }).then(function () {
            console.log("PACK SUBMITTED FOR REVIEW");
            res.redirect('/pack/' + pack_id);
        }, function (error) {
            console.log("PACK NOT SUBMITTED FOR REVIEW. ERROR " + error.message);
            res.redirect('/pack/' + pack_id);
        })
    }
});

// creating new packs
app.post('/new_pack', upload.array('art'), function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var files = req.files;
    var pack_description = req.body.pack_description;
    var coll_name = req.body.coll_name;
    var pricing = parseInt(req.body.pricing);
    var version = parseInt(req.body.version);
    var user_info = req.cookies.userId;

    console.log("FILE CONTENT "+files.length);
    // console.log("FILE "+JSON.stringify(files)+" COLL NAME "+coll_name+ " PRICE "+pricing+ " VERSION "+version);
    // files.forEach(function (file) {
    //     console.log("ORIGINAL "+file.originalname);
    // });
    //
    if (session && token) {

        var PackCollection = new Parse.Object.extend(PacksClass);
        var pack = new PackCollection();
        pack.set("pack_name", coll_name);
        pack.set("pack_description", pack_description);
        pack.set("user_id", user_info);
        pack.set("status", PENDING);
        pack.set("pricing", pricing);
        pack.set("version", version);
        pack.set("archive", false);

        if (files.length !== 0) {
            files.forEach(function (file) {
                var fullName = file.originalname;
                var stickerName = fullName.substring(0, fullName.length - 4);

                var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);

                pack.set("art_work", parseFile);

            });
        } else {
            var fileUrl = "https://cryptic-waters-41617.herokuapp.com/public/assets/images/image-profile-placeholder.png";
            var name = "image-profile-placeholder.png";
            console.log("FILEURL "+fileUrl);

            var options = {
                url: fileUrl,
                dest: __dirname + '/public/uploads/' + name
            }

            download.image(options)
                .then(({filename, image}) => {
                    bitmap = fs.readFileSync(filename, {encoding: 'base64'});
                    var parseFile = new Parse.File(name, {base64: bitmap});
                    pack.set("art_work", parseFile);
                }).then(function () {
                pack.save().then(function () {
                    res.redirect('/pack/' + collection.id);
                }, function (error) {
                    console.log("BIG ERROR "+error.message);
                    res.redirect('/pack/' + collection.id);
                })
            })
        }

        pack.save().then(function (collection) {

            res.redirect('/pack/' + collection.id);

        });
    }
    else {
        res.redirect("/");
    }
});


//EDIT/STICKER DETAILS
app.get('/details/:id/:coll_id', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var id = req.params.id;
    var pack_ = req.params.coll_id;
    var stickerDetail;
    var allCategories;

    if (session && token) {

        Parse.Promise.when(
            new Parse.Query(StickerClass).equalTo("objectId", id).first({sessionToken: token}),
            new Parse.Query(CategoryClass).find()
        ).then(function (sticker, categories) {

                stickerDetail = sticker;
                allCategories = categories;

                var sticker_relation = sticker.relation(CategoryClass);
                return sticker_relation.query().find();

            }
        ).then(function (stickerCategories) {

            var categoryNames = [];
            _.each(stickerCategories, function (category) {
                categoryNames.push(category.get("name"))
            });

            console.log("CATEGORY NAMES " + categoryNames);

            res.render("pages/details", {
                sticker: stickerDetail,
                categoryNames: categoryNames,
                categories: allCategories,
                pack_id: pack_
            });

        }, function (err) {
            //TODO handle error code
            console.log("Error Loading-----------------------" + JSON.stringify(err));
        });
    }
    else {
        res.redirect("/dashboard");
    }
});

app.post('/update_user', upload.single('im1'), function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var name = req.body.name;
    var facebook = req.body.facebook;
    var twitter = req.body.twitter;
    var instagram = req.body.instagram;
    var user_Id = req.cookies.userId;
    var imgChange = req.body.imgChange;
    var _name = req.cookies.name;
    var file = req.file;
    console.log("IMAGE CHANGED " + imgChange);

    if (session && token) {
        new Parse.Query("User").equalTo("objectId", user_Id).find().then(function (user) {
            var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
            var parseFile = new Parse.File(file.originalname, {base64: bitmap}, file.mimetype);
            user.set("facebook_handle", facebook);
            user.set("twitter_handle", twitter);
            user.set("instagram_handle", instagram);
            user.set("image", parseFile);

            if (name !== _name) {
                user.set("name", name);
            }

            if (imgChange === 'true') {
                var _bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
                var _parseFile = new Parse.File(file.originalname, {base64: _bitmap}, file.mimetype);
                user.set("image", _parseFile);
            }

            return user.save({sessionToken: token});
        }).then(function (result) {
            console.log("USER UPDATED CORRECTLY");
            res.redirect('/');
        }, function (error) {
            console.log("USER WAS NOT UPDATED " + error.message);
            res.redirect('/');
        });
    }
});


//Update Sticker
app.post('/update/:id/:pid', upload.single('im1'), function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    //input fields from form
    var stickerName = req.body.stickerName;
    var categoryList = req.body.category_name;
    var file = req.file;
    var imgChange = req.body.imgChange;
    var stickerId = req.params.id;
    var packId = req.params.pid;

    var category_list = categoryList.split(",");

    // Returns if a value is an array
    // function isArray (value) {
    //     return value && typeof value === 'object' && value.constructor === Array;
    // };

// ES5 actually has a method for this (ie9+)
    console.log("ARRAY TYPE " + Array.isArray(category_list));

    console.log("CATEGORY LIST " + JSON.stringify(category_list));

    var _listee = [];
    _.each(category_list, function (category) {
        _listee.push(category);
    });

    if (session && token) {

        Parse.Promise.when(
            new Parse.Query(StickerClass).equalTo("objectId", stickerId).first(),
            new Parse.Query(CategoryClass).containedIn("objectId", _listee).find()
        ).then(function (sticker, categories) {
            console.log("QUERIES WORKED" + JSON.stringify(categories));

            var sticker_relation = sticker.relation(CategoryClass);

            sticker.set("stickerName", stickerName);
            sticker.set("localName", stickerName);
            _.each(categories, function (category) {

                console.log("ADDED CATEGORY" + category);
                sticker_relation.add(category);

            });

            //if image has been changed
            if (imgChange === 'true') {

                //Update new sticker properties

                //update sticker image
                var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
                var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                sticker.set("uri", parseFile);
            }

            return sticker.save();


        }).then(function (sticker) {

            console.log("STICKER UPDATED" + JSON.stringify(sticker));

            if (imgChange === 'true') {
                //Delete tmp fil after update
                var tempFile = file.path;
                fs.unlink(tempFile, function (err) {
                    if (err) {
                        //TODO handle error code
                        console.log("Could not del temp++++++++" + JSON.stringify(err));
                    }
                });
            }

            console.log("FILE UPDATED SUCCESSFULLYYYY");
            res.redirect("/pack/" + packId);

        }, function (e) {
            console.log("SERVER ERROR " + JSON.stringify(e));
            res.redirect("/pack/" + packId);

        });

    } else {

        //TODO handle error code
        console.log("No session found[[[[[[");
        res.redirect("/pack/" + packId);

    }
});

app.get('/upload_page/:id/:pack_name', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var coll_id = req.params.id;
    var col_name = req.params.pack_name;

    if (session && token) {
        res.render("pages/upload", {id: coll_id, coll_name: col_name});
    } else {
        res.redirect("/dashboard");
    }

});

app.post('/upload_dropbox_file', function (req, res) {

    var bitmap;
    var name;
    var fileUrl;
    var session = req.session.token;
    var token = req.cookies.token;
    var coll_id = req.body.coll_id;
    var stickerCollection;

    if (session && token) {

        name = req.body.fileName;
        fileUrl = req.body.fileUrl; // receive url from form
        name = name.substring(0, name.length - 4);

        var options = {
            url: fileUrl,
            dest: __dirname + '/public/uploads/' + req.body.fileName
        }

        download.image(options)
            .then(({filename, image}) => {
                console.log('FILE SAVED TO ', filename);
                bitmap = fs.readFileSync(filename, {encoding: 'base64'});

                var collection = new Parse.Query(PacksClass);
                collection.equalTo("objectId", coll_id)
                    .first({sessionToken: token})
                    .then(function (collection) {
                        console.log("BITMAP PASSED BY FILE " + bitmap);
                        console.log("NAME " + name + " collection " + JSON.stringify(collection));
                        stickerCollection = collection;
                        var parseFile = new Parse.File(name, {base64: bitmap});
                        console.log("PARSEFILE " + JSON.stringify(parseFile) + " name " + name + " collection " + JSON.stringify(collection));

                        var Sticker = new Parse.Object.extend(StickerClass);
                        var sticker = new Sticker();
                        sticker.set("stickerName", name);
                        sticker.set("localName", name);
                        sticker.set("uri", parseFile);
                        sticker.set("parent", collection);

                        console.log("LOG BEFORE SAVING STICKER");

                        return sticker.save();


                    }).then(function (sticker) {
                    console.log("STICKER FROM PARSEFILE " + JSON.stringify(sticker));
                    var collection_relation = stickerCollection.relation(PacksClass);
                    collection_relation.add(sticker);
                    console.log("LOG BEFORE SAVING STICKER COLLECTION");
                    fs.unlink(filename, function (err) {
                        if (err) {
                            //TODO handle error code
                            console.log("Could not del temp++++++++" + JSON.stringify(err));
                        }
                    });

                    return stickerCollection.save();

                }).then(function () {

                    console.log("REDIRECT TO DASHBOARD");
                    res.redirect("/pack/" + coll_id);

                }, function (error) {
                    console.log("BIG BIG ERROR" + error.message);
                    res.redirect("/pack/" + coll_id);
                });
            }).catch((err) => {
            throw err;
        });
    } else {

        res.redirect("/pack/" + coll_id);

    }

});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
});


// This will enable the Live Query real-time server
// ParseServer.createLiveQueryServer(httpServer);