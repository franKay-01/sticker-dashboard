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
var _ = require('underscore');
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
        req.session.token = user.getSessionToken();
        res.redirect("/dashboard");

    }, function (error) {
        //
        // console.log(JSON.stringify(error));
        res.redirect("/", {
            error: error.message
        });
    });
});

//UPLOAD ONE STICKER
app.post('/upload', upload.array('im1[]'), function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    // console.log("FILE INFO***************: " + JSON.stringify(req.files));
    // console.log("BODY INFO***************: " + JSON.stringify(req.body));
    // console.log("PARAMS, IF ANY *********: " + JSON.stringify(req.params));

    var files = req.files;

    if (session && token) {
        files.forEach(function (sticker, index) {

            var fullname = sticker.originalname;
            //remove file extension name
            var stickerName = fullname.substring(0, fullname.length - 4);
            //TODO get rid off localName var
            var localName = stickerName;

            var category = ['funny', 'really'];

            //converts uploaded fille to base64 format
            var bitmap = fs.readFileSync(sticker.path, {encoding: 'base64'});

            var parseFile = new Parse.File(stickerName, {base64: bitmap}, sticker.mimetype);

            //create parse file object
            var Sticker = new Parse.Object.extend("Sticker");

            //TODO organize promises
            parseFile.save().then(function () {

                //instance of parse object
                var sticker = new Sticker();
                sticker.set("stickerName", stickerName);
                sticker.set("localName", localName);
                sticker.set("uri", parseFile);
                sticker.set("category", [category]);
                sticker.set("stickerPhraseImage", "");

                sticker.save().then(function () {

                        //Delete tmp file after upload
                        var tempFile = sticker.path;
                        fs.unlink(tempFile, function (err) {
                            if (err) {
                                //TODO handle error code
                                console.log("-------Could not del temp" + JSON.stringify(err));
                            }
                        });

                        res.redirect("/dashboard");
                    },
                    function (error) {
                        //sticker was not uploaded, reload stickers page
                        //TODO handle error code
                        console.error("Could not upload file__ " + JSON.stringify(error));
                        res.redirect("/add-stickers1");
                    });
            }, function (err) {
                //sticker object was not saved, reload stickers page
                //TODO handle error code
                console.error("Obj not saved: " + JSON.stringify(err));
                res.redirect("/add-stickers1");
            });

        });
        res.redirect("/dashboard");

    }

    // //no session exists reload signup page
    else {
        function error(err) {
            //TODO report error to user
            console.log("error:::::: " + JSON.stringify(err));
            res.redirect("/");
        }
    }
});

//UPLOAD MULTIPLE STICKERS
app.post('/uploads', upload.array('im1[]'), function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var coll_id = req.body.coll_id;
    var files = req.files;
    var fileDetails = [];
    var stickerDetails = [];
    var stickerCollection;

    if (session && token) {

        var collection = new Parse.Query("Collection");
        collection.equalTo("objectId", coll_id).first({sessionToken: token}).then(function (collection) {

            stickerCollection = collection;

            files.forEach(function (file) {

                //TODO update originalname to originalName
                var fullName = file.originalname;
                var stickerName = fullName.substring(0, fullName.length - 4);

                var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                //create our parse fule
                var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                var Sticker = new Parse.Object.extend("Sticker");
                var sticker = new Sticker();
                sticker.set("stickerName", stickerName);
                sticker.set("localName", stickerName);
                sticker.set("uri", parseFile);
                sticker.set("stickerPhraseImage", "");
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
                var collection_relation = stickerCollection.relation("Collection");
                collection_relation.add(sticker);
            });

            console.log("SAVE COLLECTION RELATION");
            return stickerCollection.save();

        }).then(function () {

            console.log("REDIRECT TO DASHBOARD");
            res.redirect("/collections-dashboard");

        }, function (error) {
            console.log("BIG BIG ERROR" + error.message);
            res.redirect("/add-stickers1");
        });


    } else {

        res.redirect("/");

    }

    /* if (session && token) {

         //GET ID OF CURRENT COLLECTION
         var collection = new Parse.Query("Collection");
         collection.equalTo("objectId", coll_id);
         collection.first({sessionToken: token}).then(function (collection) {

                 //File saving Process Begins
                 files.forEach(function (file) {

                     //TODO update originalname to originalName
                     var fullName = file.originalname;
                     var stickerName = fullName.substring(0, fullName.length - 4);

                     //TODO eliminate localName var
                     var localName = stickerName;
                     var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});

                     //create our parse fule
                     var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);

                     parseFile.save().then(function () {

                         //instance of parse object
                         var Sticker = new Parse.Object.extend("Sticker");
                         var sticker = new Sticker();
                         sticker.set("stickerName", stickerName);
                         sticker.set("localName", localName);
                         sticker.set("uri", parseFile);
                         sticker.set("stickerPhraseImage", "");
                         sticker.set("parent", collection);

                         sticker.save().then(function () {

                             var collection_relation = collection.relation("Collection");
                             collection_relation.add(sticker);
                             collection.save({
                                 success: function () {
                                     console.log("-----------Relation creation successful--------");
                                 },
                                 error: function (error) {
                                     console.log("-----------Failed to create relation------" + error);
                                 }
                             });

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
                     });

                 });
                 res.redirect("/collections-dashboard");
                 //File saving Process Ends
             },
             function (error) {

                 //TODO handle error code
                 console.log("Not Found collection::::::::::: " + JSON.stringify(error));
             });

         res.redirect("/dashboard");

     }*/

    // //no session exists reload signup page
    /*else {
        function error(err) {
            console.log("error:::::: " + JSON.stringify(err));
            res.redirect("/");
        }
    }*/
});

//SELECT CATEGORIES PAGE
app.get('/categories', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {
        res.render("pages/categories");
    } else {
        res.redirect("/");
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
    // console.log("Session===========" + JSON.stringify(session));
    // console.log("Token===========" + JSON.stringify(token));

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

    if (session && token) {

        new Parse.Query("Collection").find({sessionToken: token}).then(function (collections) {

            res.render("pages/collections-dashboard", {collections: collections});

        }, function (error) {
            //TODO handle error code
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
    var token = req.cookies.token;
    var coll_id = req.params.id;

    if (session && token) {

        var collection = new Parse.Query("Collection");
        collection.get(coll_id, {
            success: function (collection) {
                //todo change the column 'collection' in Collection class to stickers in parse dashboard
                //todo then do the same for below

                var col = collection.relation("Collection");
                col.query().find({
                    success: function (stickers) {
                        res.render("pages/collection", {stickers: stickers, id: coll_id});
                    },
                    error: function (error) {
                        //TODO handle error code
                        response.error(error);
                        res.redirect("/dashboard")
                    }
                })
            }
        });

    }
    else {
        //No session exists, log in
        res.redirect("/");
    }

});


// Add Stickers Version 1
app.get('/add-stickers1/:id', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;

    // console.log("NEW BODY INFO-----" + JSON.stringify(req.body));
    // console.log("NEW PARAMS INFO-----" + JSON.stringify(req.params));
    var coll_id = req.params.id;

    if (session && token) {
        res.render("pages/add-stickers1", {id: coll_id});
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


app.post('/new-collection', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;

    var coll_name = req.body.coll_name;

    if (session && token) {

        var Collection = new Parse.Object.extend("Collection");
        var collection = new Collection();
        collection.set("collection_name", coll_name);
        collection.save().then(function (coll) {
        });

        res.redirect('/collections-dashboard');

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
                    res.render("pages/details", {sticker: sticker});
                } else {
                    //sticker does not exist
                    res.redirect("/dashboard")
                }
            },
            function (err) {
                //TODO handle error code
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

    // console.log("NEW FILE INFO----" + JSON.stringify(req.file));
    // console.log("NEW BODY INFO-----" + JSON.stringify(req.body));
    // console.log("NEW PARAMS INFO-----" + JSON.stringify(req.params));

    // //input fields from form
    //TODO eliminate localName...same as stickerName
    var stickerName = req.body.stickername;
    var localName = stickerName;
    var category = req.body.cat;
    var file = req.file;
    var imgChange = req.body.imgChange;
    var stickerId = req.params.id;

    if (session && token) {

        var NewSticker = new Parse.Object.extend("Sticker");
        var sticker = new Parse.Query(NewSticker);
        sticker.equalTo("objectId", stickerId);

        sticker.first({sessionToken: token}).then(
            function (newSticker) {
                //Update new sticker properties
                newSticker.set("stickerName", stickerName);
                newSticker.set("localName", localName);
                newSticker.set("category", [category]);
                newSticker.set("stickerPhraseImage", "");

                if (imgChange === 'true') {
                    //update sticker image
                    var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
                    var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                    newSticker.set("uri", parseFile);
                }
                else {
                    //image has not changed
                }
                //Update sticker's properties to parse
                newSticker.save().then(function () {
                        //Delete tmp fil after update
                        var tempFile = file.path;
                        fs.unlink(tempFile, function (err) {
                            if (err) {
                                //TODO handle error code
                                console.log("Could not del temp++++++++" + JSON.stringify(err));
                            }
                        });
                    },
                    function (problem) {
                        //sticker not updated...reload page
                        //TODO handle error code
                        console.error("Update unsuccessful__ " + JSON.stringify(problem));
                        res.redirect("/details", {id: stickerId});
                    }
                );
            },
            function (notfound) {
                //TODO handle error code
                console.log("STICKER NOT FOUND: " + JSON.stringify(notfound))
            }
        );
        res.redirect("/dashboard");
    }
    else {
        function problem(error) {
            //TODO handle error code
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