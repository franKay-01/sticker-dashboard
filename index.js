var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var S3Adapter = require('parse-server').S3Adapter;
var SimpleSendGridAdapter = require('parse-server-sendgrid-adapter');
var path = require('path');
var cors = require('cors');
var Parse = require("parse/node"); // import the module
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var fs = require('fs');
var multer = require('multer');
var methodOverride = require('method-override');
var multipart = require('multipart');
// var busboy = require('connect-busboy');


var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

Parse.initialize("d55f9778-9269-40c2-84a2-e0caaf2ad87a");
Parse.serverURL = 'https://cryptic-waters-41617.herokuapp.com/parse/';

if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
    //**** General Settings ****//

    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed

    //**** Security Settings ****//
    // allowClientClassCreation: process.env.CLIENT_CLASS_CREATION || false,
    appId: process.env.APP_ID || 'myAppId',
    masterKey: process.env.MASTER_KEY || 'myMasterKey', //Add your master key here. Keep it secret!
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
    //TODO add append parse if necessary
    publicServerURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
    /* This will appear in the subject and body of the emails that are sent */
    appName: process.env.APP_NAME || "Effective Email Marketing",

    /* emailAdapter: {
     module: 'parse-server-sendgrid-adapter',
     options: {
     fromAddress: process.env.EMAIL_FROM || "test@example.com",
     //domain: process.env.SENDGRID_DOMAIN || "example.com",
     apiKey: process.env.SENDGRID_API_KEY  || "apikey"
     }
     },*/

    emailAdapter: SimpleSendGridAdapter({
        apiKey: process.env.SENDGRID_API_KEY || "apikey",
        fromAddress: process.env.EMAIL_FROM || "test@example.com"
    }),

    //**** File Storage ****//
    filesAdapter: new S3Adapter(
        "AKIAIK4H65MXJJMO7Q6A",
        "A85CCq3+X8c7pBHg6EOdvIL3YzPuvNyPwG8wvyNK",
        "cyfa",
        {
            directAccess: true
        }
        /*
         S3_BUCKET
         S3_ACCESS_KEY
         S3_SECRET_KEY
         * */
    )
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

//for file uploads
//for file uploads

var app = express();

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
app.use(cookieParser("A85CCq3+X8c7pBHg6EOdvIL3YzPuvNyPwG8wvyNK"));

//app.use(parseExpressHttpsRedirect());

//TODO use to pass basic functionality to template
//app.locals.filters = filters;


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
    if (session) {
        res.redirect("/dashboard");
    } else {
        res.render("pages/signup");
    }
});


//login the user in using Parse
app.post('/login', function (req, res) {

    var username = req.body.username;
    var password = req.body.password;

    Parse.User.logIn(username, password).then(function (user) {

        res.cookie('token', user.getSessionToken());
        // console.log("Cookieeeeeeeeeeee:" + JSON.stringify(cookie));
        req.session.token = user.getSessionToken();
        res.redirect("/dashboard");

    }, function (error) {

        console.log(JSON.stringify(error));
        //error goes here
        res.redirect("/", {
            error: error.message
        });
    });
});

//Upload File To Parse..........upload.any()--multiple files
app.post('/uploads', upload.array('im1[]'), function (req, res) {

    var session = req.session.token;
    var token   = req.cookies.token;

    console.log("FILE INFO " + JSON.stringify(req.files));

    var files = req.files;

    if (session && token) {
        files.forEach(function (sticker, index) {

            var fullname = sticker.originalname;
            console.log("FULLNAME****** " + JSON.stringify(fullname));
            var stickerName = fullname.substring(0, fullname.length - 4);
            var localName = stickerName;
            var category = ["funny, really"];

            console.log('File Path---------------: ' + JSON.stringify(sticker.path));
            var bitmap = fs.readFileSync(sticker.path, {encoding: 'base64'});

            var parseFile = new Parse.File(stickerName, {base64: bitmap}, sticker.mimetype);
            console.log("Parse File::::::::::" + JSON.stringify(parseFile));

            //parse file object
            var StickerObject = new Parse.Object.extend("Sticker");
            parseFile.save().then(function () {
                console.log('saving parse file................');

                //instance of parse file object
                var sticker = new StickerObject();
                sticker.set("stickerName", stickerName);
                sticker.set("localName", localName);
                sticker.set("uri", parseFile);
                sticker.set("category", [category]);
                sticker.set("stickerPhraseImage", "");

                sticker.save().then(function () {
                        //file has been uploaded, back to dashboard
                        console.log("image uploaded to parse");

                        //Delete tmp fil after upload
                        var tmpFN = sticker.path;
                        fs.unlink(tmpFN, function (err) {
                            if (err) {
                                console.log("-------Could not del temp" + JSON.stringify(err));
                            }
                            else {
                                console.log('deleted tmp file.....Size: ' + sticker.size);
                            }
                        });

                        res.redirect("/dashboard");
                    },
                    function (problem) {
                        //sticker was not uploaded, reload stickers page
                        console.error("Could not upload file__ " + JSON.stringify(problem));
                        res.redirect("/add-stickers1");
                    });
            }, function (err) {
                //sticker object was not saved, reload stickers page
                console.error("Obj not saved: " + JSON.stringify(err));
                res.redirect("/add-stickers1");
            });

        });
        res.redirect("/dashboard");

    }

    // //no session exists reload signup page
    else {
        function error(err) {
            console.log("error:::::: " + JSON.stringify(err));
            res.redirect("/");
        }
    }
});

//NEW UPLOAD FORM/PAGE
app.post('/upload', upload.array('im1[]'), function (req, res) {

    var session = req.session.token;
    var token   = req.cookies.token;
    // var coll_id = req.params.id;

    // console.log("Collection ID===========" + JSON.stringify(coll_id));

    console.log("FILE INFO********: " + JSON.stringify(req.files));

    var files = req.files;

    if (session && token) {
        files.forEach(function (sticker, index) {

            var fullname = sticker.originalname;
            console.log("FULLNAME****** " + JSON.stringify(fullname));
            var stickerName = fullname.substring(0, fullname.length - 4);
            var localName = stickerName;
            var category = ["funny, really"];

            console.log('File Path---------------: ' + JSON.stringify(sticker.path));
            var bitmap = fs.readFileSync(sticker.path, {encoding: 'base64'});

            var parseFile = new Parse.File(stickerName, {base64: bitmap}, sticker.mimetype);
            console.log("Parse File::::::::::" + JSON.stringify(parseFile));

            //parse file object
            var StickerObject = new Parse.Object.extend("Sticker");
            parseFile.save().then(function () {
                console.log('saving parse file................');

                //instance of parse file object
                var sticker = new StickerObject();
                sticker.set("stickerName", stickerName);
                sticker.set("localName", localName);
                sticker.set("uri", parseFile);
                sticker.set("category", [category]);
                sticker.set("stickerPhraseImage", "");


                sticker.save().then(function () {
                        //file has been uploaded, back to dashboard
                        console.log("image uploaded to parse");

                        //GET ID OF CURRENT COLLECTION
                        var colq = new Parse.Query("Collection");
                        colq.equalTo("collection_name", "Ghamoji");
                        colq.first({sessionToken: token}).then(function (collection){
                                console.log("Current Collection====== " + JSON.stringify(collection));
                                var collection_relation = collection.relation("collection_relation");
                                collection_relation.add(sticker);
                                console.log("Relation added to collection class");
                            },
                            function (error) {
                                console.log("Unfound collectionnnnnnnn: " + JSON.stringify(error));
                            });

                        //Delete tmp fil after upload
                        var tmpFN = sticker.path;
                        fs.unlink(tmpFN, function (err) {
                            if (err) {
                                console.log("-------Could not del temp" + JSON.stringify(err));
                            }
                            else {
                                console.log('deleted tmp file.....Size: ' + sticker.size);
                            }
                        });

                        res.redirect("/dashboard");
                    },
                    function (problem) {
                        //sticker was not uploaded, reload stickers page
                        console.error("Could not upload file__ " + JSON.stringify(problem));
                        res.redirect("/add-stickers1");
                    });
            }, function (err) {
                //sticker object was not saved, reload stickers page
                console.error("Obj not saved: " + JSON.stringify(err));
                res.redirect("/add-stickers1");
            });

        });
        res.redirect("/dashboard");

    }

    // //no session exists reload signup page
    else {
        function error(err) {
            console.log("error:::::: " + JSON.stringify(err));
            res.redirect("/");
        }
    }
});



//LOGOUT
app.get('/logout', function (req, res) {

    req.session = null;
    res.cookie('token', "");
    res.redirect("/");

});

// Dashboard
app.get('/dashboard', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    console.log("Session===========" + JSON.stringify(session));
    console.log("Token===========" + JSON.stringify(token));

    if (session && token) {

        new Parse.Query("Sticker").find({sessionToken: token}).then(function (stickers) {

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
//Displays 'folders' representing each collection from Parse
app.get('/collections-dashboard', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    console.log("Session===========" + JSON.stringify(session));
    console.log("Token===========" + JSON.stringify(token));

    if (session && token) {

        new Parse.Query("Collection").find({sessionToken: token}).then(function (collections) {

            res.render("pages/collections-dashboard", {collections: collections});

        }, function (error) {

            console.log("Colll error" + JSON.stringify(error));

        });

    }
    else {
        console.log("No Session Exists, log in");
        res.redirect("/");
    }
});

// Page for selected collection from dashboard
//Displays all stickers linked to selected collection
app.get('/collection/:id', function (req, res) {

    var session = req.session.token;
    var token   = req.cookies.token;
    var coll_id = req.params.id;

    console.log("Session===========" + JSON.stringify(session));
    console.log("Token===========" + JSON.stringify(token));
    console.log("Collection ID===========" + JSON.stringify(coll_id));

    if (session && token) {

        //TODO get current collection's id and find all stickers that are linked to it
        var sticker = new Parse.Query("Stickers");
        sticker.equalTo("parent", coll_id);
        sticker.first({sessionToken: token}).then(function (stickers) {

                if (stickers) {

                    console.log("Sticker::::::::::::::::" + JSON.stringify(stickers));
                    res.render("pages/collection", {stickers: stickers});
                } else {
                    console.log("Nothing Found::::::::::::::::");
                    res.redirect("/dashboard")
                }

            },
            function (err) {
                console.log("Error Loading-----------------------" + JSON.stringify(err));
            }
        );

    }
    else {
        console.log("No Session Exists, log in");
        res.redirect("/");
    }

});


// Add Stickers Version 1
app.get('/add-stickers1', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {
        res.render("pages/add-stickers1");
    } else {
        res.redirect("/");
    }
});


// Add Stickers Version 2
app.get('/add-stickers2', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {
        res.render("pages/add-stickers2");
    } else {
        res.redirect("/");
    }
});


// Add Stickers Version 3
app.get('/add-to-collection', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {
        res.render("pages/add-to-collection");
    } else {
        res.redirect("/");
    }
});


//EDIT/STICKER DETAILS
app.get('/details/:id', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var id = req.params.id;

    if (session && token) {
        var sticker = new Parse.Query("Sticker");
        sticker.equalTo("objectId", id);
        sticker.first({sessionToken: token}).then(function (sticker) {

                if (sticker) {

                    console.log("Sticker::::::::::::::::" + JSON.stringify(sticker));
                    res.render("pages/details", {sticker: sticker});
                } else {
                    console.log("Nothing Found::::::::::::::::");
                    res.redirect("/dashboard")
                }

            },
            function (err) {
                console.log("Error Loading-----------------------" + JSON.stringify(err));
            }
        );
    }
    else {
        res.redirect("/dashboard");
    }
});

//Update Sticker
app.post('/update/:id', upload.single('im1'), function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    console.log("NEW FILE INFO----" + JSON.stringify(req.file));
    console.log("NEW BODY INFO-----" + JSON.stringify(req.body));
    console.log("NEW PARAMS INFO-----" + JSON.stringify(req.params));

    // //input fields from form
    var stickerName = req.body.stickername;
    console.log("NEW STICKER NAMEEEEEEEE: " + JSON.stringify(stickerName));
    var localName = req.body.localname;
    var category = req.body.cat;
    var file = req.file;
    var imgChange = req.body.imgChange;
    var stickerId = req.params.id;

    if (session && token) {

        var NewSticker = new Parse.Object.extend("Sticker");
        var squery = new Parse.Query(NewSticker);
        squery.equalTo("objectId", stickerId);

        squery.first({sessionToken: token}).then(
            function (newSticker) {
                console.log("STICKER FOUND FOR UPDATEEEEEEEEEEEEEEE: " + JSON.stringify(newSticker));
                //Update new sticker properties
                newSticker.set("stickerName", stickerName);
                newSticker.set("localName", localName);
                newSticker.set("category", [category]);
                newSticker.set("stickerPhraseImage", "");

                if (imgChange === 'true') {
                    console.log('image has changed paaaaaaaaaa');

                    //update sticker image
                    var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
                    var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                    newSticker.set("uri", parseFile);
                }
                else {
                    console.log('image has not changed koraaaaaaaaa');

                }
                    //Update sticker's properties to parse
                    newSticker.save().then(function () {

                            console.log("image updated to parse");

                            //Delete tmp fil after update
                            var tmpFN = file.path;
                            fs.unlink(tmpFN, function (err) {
                                if (err) {
                                    console.log("Could not del temp++++++++" + JSON.stringify(err));
                                }
                                else {
                                    console.log('deleted tmp file.....Size: ' + file.size);
                                }
                            });
                        },
                        function (problem) {
                            //sticker not updated...reload page
                            console.error("Update unsuccessful__ " + JSON.stringify(problem));
                            res.redirect("/details", {id: stickerId});
                        }
                    );
            },
            function (notfound) {
                console.log("STICKER NOT FOUND: " + JSON.stringify(notfound))
            }
        );
        res.redirect("/dashboard");
    }
    else {
        function problem(error) {
            console.log("No session found[[[[[[" + error);
            res.redirect("/details");
        }
    }
});


var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
});


// This will enable the Live Query real-time server
// ParseServer.createLiveQueryServer(httpServer);