//main imports
let express = require('express');
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
let multer = require('multer');
let download = require('image-downloader');
let resolve = require('path').resolve;

//utility module for filtering lists
let _ = require('underscore');

//imported class
let helper = require('./cloud/modules/helpers');
let type = require('./cloud/modules/type');

//google app engine configuration
//let config = require('./config.json');

//TODO create method to handle errors aka handleError
let errorMessage = "";
let searchErrorMessage = "";

let StickerClass = "Stickers";
let CategoryClass = "Categories";
let PacksClass = "Packs";
let ReviewClass = "Reviews";
let StoryClass = "Stories";
let MainStoryClass = "StoryBody";
let StoryCatalogue = "StoryCatalogue";
let ArtWork = "ArtWork";
let MessageClass = "Contact";
let AdvertClass = "Advert";
let AdvertImageClass = "AdvertImages";
let Profile = "Profile";
let Latest = "Latest";

const NORMAL_USER = 2;
const SUPER_USER = 0;

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

// app.use(cookieSession({
//     name: "session",
//     secret: "A85CCq3+X8c7pBHg6EOdvIL3YzPuvNyPwG8wvyNK",
//     maxAge: 15724800000
// }));
// app.use(cookieParser("A85CCq3+X8c7pBHg6EOdvIL3YzPuvNyPwG8wvyNK"));


// set a cookie
/*app.use(function (req, res, next) {
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
});*/


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

function getUser(token) {

    return new Parse.Query('_Session')
        .equalTo('sessionToken', token)
        .include('user').first({sessionToken: token});
}

/*
how to use this function parseInstance.setACL(getACL(user,true|false));
* */
function setPermission(user, isPublicReadAccess) {
    let acl = new Parse.ACL(user);
    acl.setPublicReadAccess(isPublicReadAccess);
    return acl;
}

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
        res.redirect("/home");
    } else {
        //retrieve stickers to randomly display on the home page
        //TODO EksXNOeVKj
        //.equalTo("objectId", "EksXNOeVKj")
        //TODO mimi get stickers


        return new Parse.Query(PacksClass).equalTo("objectId", "EksXNOeVKj").first().then(function (pack) {

            if (pack) {

                console.log("PACK " + JSON.stringify(pack));

                let col = pack.relation(PacksClass);
                return col.query().limit(40).find();

            } else {
                return []
            }

        }).then(function (stickers) {

            if (stickers.length) {

                console.log("STICKERS " + JSON.stringify(stickers));

                stickers = helper.shuffle(stickers);
                stickers = stickers.slice(0, 3);

                //TODO merge render objects
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

app.get('/sign_up', function (req, res) {
    let message = "";
    res.render("pages/sign_up", {error: message});
});

app.post('/signup', function (req, res) {
    let name = req.body.name;
    let username = req.body.username;
    let password = req.body.password;

    let user = new Parse.User();
    user.set("name", name);
    user.set("username", username);
    user.set("password", password);
    user.set("type", NORMAL_USER);
    user.set("image_set", false);

    let user_profile = new Parse.Object.extend(Profile);
    let profile = new user_profile();

    user.signUp({useMasterKey: true}, {
        success: function (user) {

            profile.set("user_id", user.id);
            profile.set("email", username);

            profile.save().then(function () {
                res.redirect("/");
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


app.post('/new_story', function (req, res) {
    let token = req.cookies.token;
    let title = req.body.title;
    let summary = req.body.summary;
    let pack_id = req.body.pack_id;
    let body = req.body.story;
    let keywords = req.body.keyword;
    let _keywords = [];
    let story_id = "";

    if (keywords !== undefined || keywords !== "undefined") {
        _keywords = keywords.split(",");
    }

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let Stories = new Parse.Object.extend(StoryClass);
            let story = new Stories();

            story.set("title", title);
            story.set("summary", summary);
            story.set("pack_id", pack_id);
            story.set("keyword", _keywords);
            story.set("is_latest_story", false);
            story.set("published", false);
            story.set("user_id", _user.id);

            return story.save();

        }).then(function (story) {
            let Main = new Parse.Object.extend(MainStoryClass);
            let main = new Main();

            story_id = story.id;
            main.set("story_id", story.id);
            main.set("story", body);

            return main.save();

        }).then(function () {

            res.redirect('/stories/' + story_id);

        }, function (error) {
            console.log("ERROR WHEN CREATING NEW STORY " + error.message);
            res.redirect('/');
        });
    }

});

//TODO merge add_sticker_of_day and add_story_of_the_day
app.post('/add_story_of_day', function (req, res) {

    let token = req.cookies.token;
    let id = req.body.story_id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(Latest).equalTo("objectId", "jU3SwZUJYl").first();

        }).then(function (latest) {

            latest.set("latest_id", id);
            return latest.save();

        }).then(function () {

            res.redirect('/home');

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/home');

        })
    }
});

app.get('/send_message', function (req, res) {

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

app.get('/advert_collection', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(AdvertClass).find();

        }).then(function (adverts) {

            res.render("pages/advert_collection", {
                adverts: adverts
            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    }
})

app.get('/advert_details/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(AdvertClass).equalTo("objectId", id).first(),
                new Parse.Query(AdvertImageClass).equalTo("advert_id", id).find()
            );

        }).then(function (advert, advertImages) {

            console.log("ADS " + JSON.stringify(advert));

            res.render("pages/advert_details", {

                ad_details: advert,
                ad_images: advertImages
            })

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })

    }
});

app.post('/update_advert/:id', upload.array('adverts[]'), function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let files = req.files;
    let title = req.body.title;
    let description = req.body.description;
    let link = req.body.link;
    let fileDetails = [];
    let stickerDetails = [];

    if (link !== undefined || link !== "undefined") {
        _links = link.split(",");
    }

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(AdvertClass).equalTo("objectId", id).first();

        }).then(function (advert) {

            advert.set("title", title);
            advert.set("description", description);
            advert.set("link", _links);

            return advert.save();

        }).then(function () {

            files.forEach(function (file) {

                let fullName = file.originalname;
                let image_name = fullName.substring(0, fullName.length - 4);

                let bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                //create our parse file
                let parseFile = new Parse.File(image_name, {base64: bitmap}, file.mimetype);
                console.log("PARSEFILE " + JSON.stringify(parseFile));

                let Advert_Image = new Parse.Object.extend(AdvertImageClass);
                let advert_image = new Advert_Image();

                advert_image.set("name", image_name);
                advert_image.set("advert_id", id);
                advert_image.set("uri", parseFile);

                stickerDetails.push(advert_image);
                fileDetails.push(file);

            });

            return Parse.Object.saveAll(stickerDetails);

        }).then(function (sticker) {

            _.each(fileDetails, function (file) {
                //Delete tmp fil after upload
                var tempFile = file.path;
                fs.unlink(tempFile, function (error) {
                    if (error) {
                        //TODO handle error code
                        console.log("-------Could not del temp" + JSON.stringify(error));
                    }
                    else {
                        console.log("-------Deleted All Files");

                    }
                });
            });

            return true;

        }).then(function () {

            res.redirect('/advert_details/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);

        })
    }

});

app.post('/new_advert', function (req, res) {

    let token = req.cookies.token;
    let title = req.body.title;
    let description = req.body.description;
    let link = req.body.link;
    let _links = [];

    if (link !== undefined || link !== "undefined") {
        _links = link.split(",");
    }

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            let Advert = new Parse.Object.extend(AdvertClass);
            let advert = new Advert();

            advert.set("title", title);
            advert.set("description", description);
            advert.set("user_id", _user.id);
            advert.set("link", _links);

            return advert.save();

        }).then(function (advert) {

            res.redirect('/advert_details/' + advert.id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        });
    }

});

app.post('/messages', function (req, res) {

    let token = req.cookies.token;
    let name = req.body.name;
    let email = req.body.email;
    let message = req.body.message;
    let source = parseInt(req.body.source);

    if (token) {

        getUser(token).then(function (sessionToken) {

            let Contact = new Parse.Object.extend(MessageClass);
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

            return new Parse.Query(MessageClass).ascending().find();

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
    }
});

app.get('/single_message/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(MessageClass).equalTo("objectId", id).first();

        }).then(function (message) {

            res.render("pages/single_message", {
                message: message
            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/home');
        });
    }

});

app.get('/sticker_of_day', function (req, res) {
    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(StickerClass).equalTo("sold", false).find();

        }).then(function (stickers) {

            res.render("pages/sticker_of_day", {
                stickers: stickers
            });
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    }
});

app.post('/add_sticker_of_day', function (req, res) {

    let token = req.cookies.token;
    let id = req.body.sticker_id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(Latest).equalTo("objectId", "H9c8hykNqO").first();

        }).then(function (latest) {

            latest.set("latest_id", id);

            return latest.save();

        }).then(function () {

            res.redirect('/home');

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/sticker_of_day');

        });
    }

})

app.get('/story_of_day', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(StoryClass).find();

        }).then(function (stories) {

            res.render("pages/story_of_day", {

                stories: stories

            });


        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    }
});

app.post('/new_catalogue_sticker/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        let _user = {};
        let _story = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(StoryClass).equalTo("objectId", id).first();

        }).then(function (story) {

            _story = story;

            return new Parse.Query(PacksClass).equalTo("objectId", story.get("pack_id")).first();

        }).then(function (pack) {

            let col = pack.relation(PacksClass);
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
    }
});

app.get('/stories/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        let _user = {};
        let _story = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(StoryClass).equalTo("objectId", id).first();

        }).then(function (story) {

            _story = story;

            return new Parse.Query(PacksClass).equalTo("objectId", story.get("pack_id")).first();

        }).then(function (pack) {

            let col = pack.relation(PacksClass);
            return col.query().find();

        }).then(function (stickers) {

            res.render("pages/stories", {
                story: _story.id,
                stickers: stickers
            });

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/');

        });
    }
});

app.post('/add_catalogue_artwork/:id', function (req, res) {

    let token = req.cookies.token;
    let sticker_id = req.body.sticker_id;
    let story_id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {
            let Story = new Parse.Object.extend(StoryCatalogue);
            let catalogue = new Story();

            catalogue.set("content", sticker_id);
            catalogue.set("story_id", story_id);
            catalogue.set("type", STICKER);

            return catalogue.save();
        }).then(function () {

            res.redirect('/story_catalogue/' + story_id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/story_details/' + story_id);

        })
    }
});

app.post('/add_story_artwork/:id', function (req, res) {
    let token = req.cookies.token;
    let sticker_id = req.body.sticker_id;
    let story_id = req.params.id;

    if (token) {

        let _user = {};
        let id;

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(StickerClass).equalTo("objectId", sticker_id).first(),
                new Parse.Query(StoryClass).equalTo("objectId", story_id).first());

        }).then(function (sticker, story) {
            id = story.id;

            let Artwork = new Parse.Object.extend(ArtWork);
            let artwork = new Artwork();

            artwork.set("name", sticker.get("stickerName"));
            artwork.set("object_id", id);
            artwork.set("sticker", sticker.get("uri"));

            return artwork.save();

        }).then(function () {

            res.redirect('/story_details/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/stories/' + story_id);

        });
    }
});

app.get('/story_catalogue/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {


            res.render("pages/story_catalogue", {

                story_id: id

            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/story_catalogue');
        });
    }
});

app.get('/story_details/:id', function (req, res) {

    let token = req.cookies.token;
    let story_id = req.params.id;

    if (token) {

        let _user = {};
        let _story = {};

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(StoryClass).equalTo("objectId", story_id).first(),
                new Parse.Query(ArtWork).equalTo("object_id", story_id).first());
        }).then(function (story, sticker) {

            _story = story;

            res.render("pages/story_details", {
                story: _story,
                sticker: sticker
            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/story_collection');
        })

    }
});

app.get('/story_collection', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            return Parse.Promise.when(
                new Parse.Query(StoryClass).find(),
                new Parse.Query(PacksClass).find(),
                new Parse.Query(ArtWork).find()
            );


        }).then(function (story, allPack, artwork) {

            res.render("pages/story_collection", {
                story: story,
                allPacks: allPack,
                arts: artwork
            })
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');
        })
    }
});

app.post('/edit_story/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let title = req.body.title;
    let keyword = req.body.keyword;
    let color = req.body.color;
    let summary = req.body.summary;
    let _keyword = [];
    let _color = [];

    if (color !== "undefined" || color !== undefined) {
        _color = color.split(",");
    }

    if (keyword !== "undefined" || keyword !== undefined) {
        _keyword = keyword.split(",");
    }

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {
            _user = sessionToken.get("user");

            return new Parse.Query(StoryClass).equalTo("objectId", id).first();

        }).then(function (story) {

            story.set("title", title);
            story.set("keyword", _keyword);
            story.set("summary", summary);
            story.set("color", _color);

            return story.save();
        }).then(function () {

            res.redirect('/story_details/' + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/story_details/' + id);

        })
    }
});

app.get('/main_story/:id/:title', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let title = req.params.title;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(MainStoryClass).equalTo("story_id", id).first();

        }).then(function (story) {

            res.render("pages/story_page", {
                story: story,
                title: title
            });

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/story_details/' + id);
        });
    }
});

app.post('/new_catalogue_image/:id', upload.array('im1'), function (req, res) {

    let token = req.cookies.token;
    let files = req.files;
    let id = req.params.id;

    if (token) {

        console.log("FILES " + JSON.stringify(files));

        getUser(token).then(function (sessionToken) {

            var Artwork = new Parse.Object.extend(ArtWork);
            var art = new Artwork();

            files.forEach(function (file) {

                var fullName = file.originalname;
                var stickerName = fullName.substring(0, fullName.length - 4);

                var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                //create our parse file
                var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                console.log("PARSEFILE " + JSON.stringify(parseFile));


                art.set("name", stickerName);
                art.set("story_id", id);
                art.set("uri", parseFile);

            });

            return art.save();
        }).then(function (artwork) {

            console.log("ARTWORK " + artwork.id);
            let Story = new Parse.Object.extend(StoryCatalogue);
            let catalogue = new Story();

            catalogue.set("type", IMAGE);
            catalogue.set("content", artwork.id);
            catalogue.set("story_id", id);

            return catalogue.save();

        }).then(function () {

            res.redirect("/story_catalogue/" + id);

        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect("/story_details/" + id);
        })
    }
});

app.post('/new_catalogue/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let content = req.body.content;
    let type = parseInt(req.body.style);

    if (token) {

        getUser(token).then(function (sessionToken) {

            let Story = new Parse.Object.extend(StoryCatalogue);
            let catalogue = new Story();

            console.log("CATALOGUE TYPE " + type);

            switch (type) {
                case TEXT:
                    catalogue.set("type", TEXT);
                    break;

                case QUOTE:
                    catalogue.set("type", QUOTE);
                    break;

                case DIVIDER:
                    catalogue.set("type", DIVIDER);
                    break;
            }

            catalogue.set("content", content);
            catalogue.set("story_id", id);

            return catalogue.save();

        }).then(function () {

            res.redirect("/story_catalogue/" + id);

        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect("/story_details/" + id);
        })
    }
});

app.post('/edit_main_story/:id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let main_story = req.body.main_story;
    let title = req.body.title;
    let story_id = "";

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(MainStoryClass).equalTo("objectId", id).first();
        }).then(function (story) {

            story_id = story.get("story_id");

            story.set("story", main_story);

            return story.save();

        }).then(function () {

            res.redirect('/main_story/' + story_id + '/' + title);

        }, function (error) {

            console.log("ERROR " + error.message)
            res.redirect('/main_story/' + story_id + '/' + title);
        })
    }
});

app.get('/review_items/:type', function (req, res) {

    let token = req.cookies.token;
    let type = req.params.type;

    if (token) {

        getUser(token).then(function (sessionToken) {

            switch (type) {
                case PACK:
                    return new Parse.Query(PacksClass).equalTo("status", type.PACK_STATUS.review).find();
                case STORY:
                    return new Parse.Query(StoryClass).equalTo("status", type.PACK_STATUS.review).find()

            }
        }).then(function (review) {

            res.render("pages/review_collection", {

                collection: review

            });
        }, function (error) {

            console.log("ERROR " + error.message);
            res.redirect('/home');

        });

    }
});

app.get('/home', function (req, res) {

    let token = req.cookies.token;

    if (token) {

        let _user = {};

        let _allPacks = [];
        let _story = [];
        let _collection = [];
        let _published = [];
        let _allAds = [];
        let _categories = [];
        let _messages = [];
        let _stickerImage;
        let _storyImage;
        let _storyBody;
        let _stickerName;
        const limit = 3;


        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(Latest).equalTo("objectId", "H9c8hykNqO").first(),
                new Parse.Query(Latest).equalTo("objectId", "jU3SwZUJYl").first()
            );

        }).then(function (sticker, story) {

            return Parse.Promise.when(
                new Parse.Query(StickerClass).equalTo("objectId", sticker.get("latest_id")).first(),
                new Parse.Query(ArtWork).equalTo("object_id", story.get("latest_id")).first(),
                new Parse.Query(StoryClass).equalTo("objectId", story.get("latest_id")).first()
            );

        }).then(function (stickerImage, storyImage, storyBody) {

            _stickerImage = stickerImage.get("uri");
            // _stickerImage = _stickerImage.url();

            _stickerName = stickerImage.get("stickerName");

            _storyImage = storyImage.get("sticker");
            // _storyImage = _storyImage.url();

            _storyBody = storyBody;


            return Parse.Promise.when(
                new Parse.Query(PacksClass).equalTo("user_id", _user.id).limit(limit).find(),
                new Parse.Query(CategoryClass).limit(limit).find(),
                new Parse.Query(StoryClass).limit(limit).find(),
                new Parse.Query(PacksClass).find(),
                new Parse.Query(CategoryClass).count(),
                new Parse.Query(PacksClass).equalTo("user_id", _user.id).count(),
                new Parse.Query(StickerClass).equalTo("user_id", _user.id).count(),
                new Parse.Query(StoryClass).equalTo("user_id", _user.id).count(),
                new Parse.Query(AdvertClass).limit(limit).find(),
                new Parse.Query(MessageClass).limit(limit).find()
            );

        }).then(function (collection, categories, story, allPacks, categoryLength, packLength,
                          stickerLength, storyLength, allAdverts, allMessages) {


            if (categories.length) {
                _categories = categories
            }

            if (collection.length) {
                _collection = collection;

            }

            if (story.length) {
                _story = story;

            }

            if (allMessages.length) {
                _messages = allMessages;
            }

            if (allPacks.length) {
                _allPacks = allPacks;
            }

            if (allAdverts.length) {
                _allAds = allAdverts;
            }

            if (_user.get("type") === NORMAL_USER) {

                res.render("pages/home", {
                    collections: _collection,
                    allPacks: _allPacks,
                    story: _story,
                    categoryLength: helper.leadingZero(categoryLength),
                    packLength: helper.leadingZero(packLength),
                    stickerLength: helper.leadingZero(stickerLength),
                    storyLength: helper.leadingZero(storyLength),
                    name: _user.get("name"),
                    verified: _user.get("emailVerified")
                });
            } else if (_user.get("type") === SUPER_USER) {

                res.render("pages/admin_home", {
                    collections: _collection,
                    categories: _categories,
                    allAdverts: _allAds,
                    allPacks: _allPacks,
                    story: _story,
                    latestSticker: _stickerImage,
                    latestStory: _storyImage,
                    storyBody: _storyBody,
                    stickerName: _stickerName,
                    messages: _messages,
                    categoryLength: helper.leadingZero(categoryLength),
                    packLength: helper.leadingZero(packLength),
                    stickerLength: helper.leadingZero(stickerLength),
                    storyLength: helper.leadingZero(storyLength),
                    user_name: _user.get("name"),
                    verified: _user.get("emailVerified")
                });

                // res.redirect("/admin_home");
            } else {
                //TODO error message
            }


        }, function (error) {
            //TODO how to display error on home page
            console.log("ERROR ON HOME " + error.message);
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
    var token = req.cookies.token;

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

    }

});

//UPLOAD MULTIPLE STICKERS
app.post('/uploads', upload.array('im1[]'), function (req, res) {

    var token = req.cookies.token;
    var collectionId = req.body.pack_id;
    var files = req.files;
    var fileDetails = [];
    var stickerDetails = [];
    var stickerCollection;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            new Parse.Query(PacksClass).equalTo("objectId", collectionId).first({sessionToken: token}).then(function (collection) {

                console.log("INSIDE COLLECTION");
                stickerCollection = collection;

                files.forEach(function (file) {

                    var fullName = file.originalname;
                    var stickerName = fullName.substring(0, fullName.length - 4);

                    var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                    //create our parse file
                    var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                    var Sticker = new Parse.Object.extend(StickerClass);
                    var sticker = new Sticker();
                    sticker.set("stickerName", stickerName);
                    sticker.set("localName", stickerName);
                    sticker.set("uri", parseFile);
                    sticker.set("user_id", _user.id);
                    sticker.set("parent", collection);
                    sticker.set("flag", false);
                    sticker.set("archive", false);
                    sticker.set("sold", true);
                    // sticker.setACL(setPermission(_user, false));

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
                console.log("EMAIL IS " + req.cookies.username);
                var mailgun = new Mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});
                var data = {
                    //Specify email data
                    from: process.env.EMAIL_FROM || "test@example.com",
                    //The email to contact
                    to: req.cookies.username,
                    //Subject and text data
                    subject: 'Stickers Uploaded',
                    html: fs.readFileSync("./uploads/sticker_upload.html", "utf8")
                }

                mailgun.messages().send(data, function (error, body) {
                    //If there is an error, render the error page
                    if (error) {
                        console.log("BIG BIG ERROR: ", error.message);
                    }
                    //Else we can greet    and leave
                    else {
                        //Here "submitted.jade" is the view file for this landing page
                        //We pass the variable "email" from the url parameter in an object rendered by Jade
                        console.log("EMAIL SENT" + body);
                    }
                });
                console.log("REDIRECT TO PACK COLLECTION");
                res.redirect("/pack/" + collectionId);

            })

        }, function (error) {
            console.log("BIG BIG ERROR" + error.message);
            res.redirect("/add_stickers");
        });


    } else {

        res.redirect("/");

    }
});

// FIND A SPECIFIC CATEGORY
app.post('/find_category', function (req, res) {

    var token = req.cookies.token;
    var categoryName = req.body.searchCategory;

    if (token) {

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
    var token = req.cookies.token;

    if (token) {

        new Parse.Query(CategoryClass).limit(CATEGORY_LIMIT).ascending().find().then(function (categories) {

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


app.post('/new_category', function (req, res) {

    var token = req.cookies.token;
    var categoryName = JSON.stringify(req.body.category_name);
    let _categories = [];
    let categoryDetails = [];

    categoryName = categoryName.substring(2, categoryName.length - 2);

    if (categoryName !== undefined || categoryName !== "undefined") {
        _categories = categoryName.split(",");
    }

    if (token) {

        getUser(token).then(function (sessionToken) {

            _categories.forEach(function (category) {

                var Category = new Parse.Object.extend(CategoryClass);
                var new_category = new Category();

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
        res.redirect("/home");
    }
});

app.post('/review_pack/:id', function (req, res) {

    var token = req.cookies.token;
    var id = req.params.id;
    var comment = req.body.review_text;
    var status = req.body.approved;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            var Reviews = new Parse.Object.extend("Reviews");
            var review = new Reviews();

            new Parse.Query(PacksClass).equalTo("objectId", id).first().then(function (pack) {
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
    }
});

app.get('/review_details/:id', function (req, res) {
    let token = req.cookies.token;
    let review_id = req.params.id;

    if (token) {
        let _user = {};
        let _review = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(ReviewClass).equalTo("objectId", review_id).first();

        }).then(function (review) {
            _review = review;

            console.log("REVIEWS " + JSON.stringify(review));
            let type = review.get("type");
            if (type === 1) {
                let id = review.get("type_id");
                return new Parse.Query(StickerClass).equalTo("objectId", id).first();
            } else {
                res.render("pages/review_details", {reviews: review});
            }

        }).then(function (sticker) {
            let sticker_url = sticker.get("uri").url();
            res.render("pages/review_details", {reviews: _review, sticker_url: sticker_url});

        }, function (error) {
            console.log("ERROR WHEN RETRIEVING REVIEW " + error.message);
            res.redirect('/review_collection');
        });
    }
});

app.get('/review_collection/:id', function (req, res) {
    var token = req.cookies.token;
    let id = req.params.id;

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            var query = new Parse.Query(ReviewClass);
            query.equalTo('owner', _user.id); // Set our channel
            query.equalTo('type', id);

            return query.find();

        }).then(function (review) {
            // res.send(JSON.stringify(review));
            res.render("pages/review_collection", {reviews: review})
        })
    }
});

app.get('/review/:id', function (req, res) {

    var token = req.cookies.token;
    var pack_id = req.params.id;

    if (token) {
        var pack = new Parse.Query(PacksClass);
        pack.get(pack_id, {
            success: function (pack) {
                var pack_name = pack.get("pack_name");
                var pack_owner = pack.get("user_name");
                let pack_onwer_id = pack.get("user_id");
                var art = pack.get("art_work");
                var pack_id = pack.id;
                var _description = pack.get("pack_description");

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
                    owner_id: pack_onwer_id,
                    description: _description
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

    var token = req.cookies.token;

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            if (_user.get("image_set") === true) {
                res.render("pages/profile", {
                    username: _user.get("name"),
                    email: _user.get("username"),
                    profile: _user.get("image").url()
                });
            } else {
                res.render("pages/profile", {
                    username: _user.get("name"),
                    email: _user.get("username"),
                    profile: "null"
                });
            }

        }, function (error) {
            console.log("ERROR ON PROFILE " + error.message);
            res.redirect('/');
        });

    }
});

app.post('/update_category', function (req, res) {

    var token = req.cookies.token;
    var newName = req.body.catname;
    var currentId = req.body.categoryId;

    if (token) {

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

    var token = req.cookies.token;
    var removeId = req.params.id;
    var pageId = req.params.pid;


    if (token) {
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

    var token = req.cookies.token;
    var removeId = req.body.inputRemoveId;

    if (token) {

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
    res.clearCookie('token');
    res.redirect("/");
});

// Dashboard
app.get('/dashboard', function (req, res) {

    var token = req.cookies.token;
    console.log("TOKEN RETRIEVED FROM BROWSER " + token);

    if (token) {

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

    var token = req.cookies.token;

    if (token) {

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

    var token = req.cookies.token;

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            let query = new Parse.Query(PacksClass);
            query.equalTo("user_id", _user.id).find({sessionToken: token}).then(function (collections) {

                res.render("pages/pack_collection", {collections: collections});

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


//Displays all stickers belonging to a selected collection
app.get('/pack/:id', function (req, res) {

    let token = req.cookies.token;
    let coll_id = req.params.id;

    if (token) {

        let _user = {};
        let type;
        let pack_name;
        let pack_status;
        let artwork;

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            type = _user.get("type");

            let query = new Parse.Query(PacksClass).equalTo("objectId", coll_id);

            switch (type) {
                case SUPER_USER:
                    return query.first({useMasterKey: true});

                case NORMAL_USER:
                    return query.first({sessionToken: token});

            }

        }).then(function (pack) {

            pack_name = pack.get("pack_name");
            pack_status = pack.get("status");
            pack_art = pack.get("art_work").url();
            pack_publish = pack.get("published");

            let col = pack.relation(PacksClass);

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
                        id: coll_id,
                        art: pack_art,
                        published: pack_publish,
                        collectionName: pack_name,
                        userType: _user.get("type"),
                        status: pack_status
                    });
                    break;

                case NORMAL_USER:
                    res.render("pages/new_pack", {
                        stickers: stickers,
                        id: coll_id,
                        art: pack_art,
                        published: pack_publish,
                        collectionName: pack_name,
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

app.get('/edit_pack_details/:id', function (req, res) {

    let token = req.cookies.token;
    let pack_id = req.params.id;

    if (token) {

        getUser(token).then(function (sessionToken) {

            return new Parse.Query(PacksClass).equalTo("objectId", pack_id).first();

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

// Add Stickers Version 1
app.get('/add_stickers/:id/:pack_name', function (req, res) {

    var token = req.cookies.token;
    var coll_id = req.params.id;
    var col_name = req.params.pack_name;

    if (token) {
        res.render("pages/add_sticker", {id: coll_id, coll_name: col_name});
    } else {
        res.redirect("/");
    }
});

app.get('/send_for_review/:id', function (req, res) {

    var token = req.cookies.token;
    var pack_id = req.params.id;

    if (token) {
        new Parse.Query(PacksClass).equalTo("objectId", pack_id).first().then(function (pack) {
            pack.set("status", type.PACK_STATUS.review);
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

    var token = req.cookies.token;
    var files = req.files;
    var pack_description = req.body.pack_description;
    var coll_name = req.body.coll_name;
    var pricing = parseInt(req.body.pricing);
    var version = parseInt(req.body.version);
    var keywords = req.body.keyword;
    let _keywords = [];

    if (keywords !== undefined || keywords !== "undefined") {
        _keywords = keywords.split(",");
    }

    console.log("FILE CONTENT " + files.length);

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            var PackCollection = new Parse.Object.extend(PacksClass);
            var pack = new PackCollection();
            pack.set("pack_name", coll_name);
            pack.set("pack_description", pack_description);
            pack.set("user_id", _user.id);
            pack.set("user_name", _user.get("name"));
            pack.set("status", type.PACK_STATUS.pending);
            pack.set("pricing", pricing);
            pack.set("version", version);
            pack.set("archive", false);
            pack.set("keyword", _keywords);
            pack.set("flag", false);
            pack.set("published", false);
            //  pack.setACL(setPermission(_user, false));


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
                console.log("FILEURL " + fileUrl);

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
                        console.log("BIG ERROR " + error.message);
                        res.redirect('/pack/' + collection.id);
                    })
                })
            }

            pack.save().then(function (collection) {

                res.redirect('/pack/' + collection.id);

            });
        }, function (error) {
            console.log("ERROR OCCURRED WHEN ADDING NEW PACK " + error.message);
            console.log('/');
        })
    }
    else {
        res.redirect("/");
    }
});

app.get('/details_update/:id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");


        });
    }
});


app.post('/edit_details/:id/:pack_id/:review_id', function (req, res) {
    let token = req.cookies.token;
    let id = req.params.id;
    let pack_ = req.params.pack_id;
    let review_id = req.params.review_id;
    let type = req.body.type;
    let categoryNames = [];
    let all;
    let name;
    let category;
    let sticker;

    console.log("REVIEW ID " + review_id);
    if (token) {
        let _user = {};

        if (type === "1") {
            getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return Parse.Promise.when(
                    new Parse.Query(StickerClass).equalTo("objectId", id).first(),
                    new Parse.Query(CategoryClass).find());
            }).then(function (sticker, categories) {
                    console.log("FIRST");
                    stickerDetail = sticker;
                    allCategories = categories;

                    var sticker_relation = sticker.relation(CategoryClass);
                    return sticker_relation.query().find();

                }
            ).then(function (stickerCategories) {
                console.log("SECOND");

                _.each(stickerCategories, function (category) {
                    categoryNames.push(category.get("name"))
                });

                return new Parse.Query(ReviewClass).equalTo("objectId", review_id).first();
            }).then(function (review) {
                console.log("THIRD " + JSON.stringify(review));

                let review_fields = review.get("review_field");
                let review_field = Array.from(review_fields);
                console.log("REVIEWS " + review_field);

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
                res.redirect('/review_details/' + review_id);
            });
        } else {
            getUser(token).then(function (sessionToken) {

                _user = sessionToken.get("user");

                return new Parse.Query(PacksClass).equalTo("objectId", id).first();
            }).then(function (pack) {
                res.render("pages/edit_pack", {pack: pack, review_id: review_id});
            }, function (error) {
                console.log("ERROR " + error.message);
                res.redirect('/review_details/' + review_id);
            });
        }
    }

});


app.post('/update_pack/:id', function (req, res) {
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

            return new Parse.Query(PacksClass).equalTo("objectId", id).first();
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
            res.redirect('/review_details/' + review_id);
        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/review_details/' + review_id);
        });
    }
});

//EDIT/STICKER DETAILS
app.get('/details/:id/:coll_id', function (req, res) {

    let token = req.cookies.token;
    let id = req.params.id;
    let pack_ = req.params.coll_id;
    let stickerDetail;
    let allCategories;
    let selectedCategories;
    let selectCategoryArray = [];

    if (token) {
        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return Parse.Promise.when(
                new Parse.Query(StickerClass).equalTo("objectId", id).first(),
                new Parse.Query(CategoryClass).ascending("name").find());

        }).then(function (sticker, categories) {

                stickerDetail = sticker;
                allCategories = categories;
                selectedCategories = sticker.get("categories");

                // if (selectedCategories){
                //     selectedCategories = Array.from(selectedCategories);
                // }

                console.log("SELECTED " + selectedCategories);

                var sticker_relation = sticker.relation(CategoryClass);
                return sticker_relation.query().find();

            }
        ).then(function (stickerCategories) {

            // var categoryNames = [];
            // _.each(stickerCategories, function (category) {
            //     categoryNames.push(category.get("name"))
            // });

            // console.log("CATEGORY NAMES " + categoryNames);

            if (_user.get("type") === SUPER_USER) {
                res.render("pages/admin_details", {
                    sticker: stickerDetail,
                    // categoryNames: categoryNames.sort(),
                    categories: allCategories,
                    pack_id: pack_
                });
            } else {
                res.render("pages/details", {
                    sticker: stickerDetail,
                    selected: selectedCategories,
                    categories: allCategories,
                    pack_id: pack_,
                    id: id
                });
            }
        }, function (err) {
            //TODO handle error code
            console.log("Error Loading-----------------------" + JSON.stringify(err));
            res.redirect("/pack/" + pack_);

        });
    }
    else {
        res.redirect("/");
    }
});

app.post('/update_user', upload.single('im1'), function (req, res) {

    var token = req.cookies.token;
    var name = req.body.name;
    var facebook = req.body.facebook;
    var twitter = req.body.twitter;
    var instagram = req.body.instagram;
    var imgChange = req.body.imgChange;
    var file = req.file;

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            new Parse.Query("User").equalTo("objectId", _user.id).first().then(function (user) {
                var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
                var parseFile = new Parse.File(file.originalname, {base64: bitmap}, file.mimetype);
                user.set("facebook_handle", facebook);
                user.set("twitter_handle", twitter);
                user.set("instagram_handle", instagram);
                user.set("image", parseFile);

                if (name !== _user.get("name")) {
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
        });
    }
});

app.post('/review_sticker/:id/:pack_id', function (req, res) {
    var token = req.cookies.token;
    var id = req.params.id;
    var pack_id = req.params.pack_id;
    var field = req.body.review_field;
    var comments = req.body.review_text;
    var status = req.body.flagged;

    // Array.from(categoryList);
    var review_field = field.split(",");

    if (token) {

        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");
            var Sticker_review = new Parse.Object.extend(ReviewClass);
            var reviews = new Sticker_review();

            new Parse.Query(StickerClass).equalTo("objectId", id).first().then(function (sticker) {
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
                res.redirect("/details/" + id + "/" + pack_id);
            });
        });
    }
});

app.post('/update_sticker/:id/:pid', upload.array('im1'), function (req, res) {
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

            return new Parse.Query(StickerClass).equalTo("objectId", id).first();
        }).then(function (sticker) {

            files.forEach(function (file) {

                var fullName = file.originalname;
                var stickerName = fullName.substring(0, fullName.length - 4);

                var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                //create our parse file
                var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);

                sticker.set("uri", parseFile);


            });
            sticker.set("name", name);
            sticker.set("categories", _category);

            return sticker.save();
        }).then(function (result) {
            res.redirect('/pack/' + pid);
        }, function (error) {
            console.log("ERROR " + error.message);
            res.redirect('/review_details/' + review_id);
        });
    }

});

//Update Sticker
app.post('/update/:id/:pid', function (req, res) {

    var token = req.cookies.token;

    //input fields from form
    var stickerName = req.body.stickerName;
    var new_categories = req.body.categories;
    var stickerId = req.params.id;
    var packId = req.params.pid;

    var _listee = [];

    if (new_categories) {

        if (new_categories !== undefined) {
            var category_new = Array.from(new_categories);

            _.each(category_new, function (category) {
                _listee.push(category);
            });
        }
    }

    if (token) {


        let _user = {};

        getUser(token).then(function (sessionToken) {

            _user = sessionToken.get("user");

            return new Parse.Query(StickerClass).equalTo("objectId", stickerId).first();

        }).then(function (sticker) {

            sticker.set("stickerName", stickerName);
            sticker.set("localName", stickerName);
            sticker.set("categories", _listee);

            return sticker.save();

        }).then(function (sticker) {

            console.log("STICKER UPDATED" + JSON.stringify(sticker));
            res.redirect("/details/" + stickerId + "/" + packId);

        }, function (error) {

            console.log("SERVER ERROR " + error.message);
            res.redirect("/details/" + stickerId + "/" + packId);

        });

    } else {

        //TODO handle error code
        console.log("No session found[[[[[[");
        res.redirect("/pack/" + packId);

    }
});

app.get('/upload_page/:id/:pack_name', function (req, res) {

    var token = req.cookies.token;
    var coll_id = req.params.id;
    var col_name = req.params.pack_name;

    if (token) {
        res.render("pages/upload", {id: coll_id, coll_name: col_name});
    } else {
        res.redirect("/dashboard");
    }

});

app.post('/upload_dropbox_file', function (req, res) {

    var bitmap;
    var name;
    var fileUrl;
    var token = req.cookies.token;
    var coll_id = req.body.coll_id;
    var stickerCollection;

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
                            sticker.set("user_id", _user.id);
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
        }, function (error) {
            console.log("SESSION INVALID " + error.message);
            res.redirect("/pack/" + coll_id);
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
