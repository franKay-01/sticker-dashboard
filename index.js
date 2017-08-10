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
var _ = require('underscore');
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
        //TODO handle errors
        res.redirect("/", {
            error: error.message
        });
    });
});

//UPLOAD ONE STICKER
app.post('/upload', upload.array('im1[]'), function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    var files = req.files;

    if (session && token) {
        files.forEach(function (sticker, index) {

            var fullname = sticker.originalname;

            //remove file extension name
            var stickerName = fullname.substring(0, fullname.length - 4);

            //converts uploaded file to base64 format
            var bitmap = fs.readFileSync(sticker.path, {encoding: 'base64'});

            var parseFile = new Parse.File(stickerName, {base64: bitmap}, sticker.mimetype);

            //create parse file object
            var Sticker = new Parse.Object.extend("Sticker");

            //TODO organize promises
            parseFile.save().then(function () {

                //instance of parse object
                var sticker = new Sticker();
                sticker.set("stickerName", stickerName);
                sticker.set("localName", stickerName);
                sticker.set("uri", parseFile);
                sticker.set("stickerPhraseImage", "");

                return sticker.save();

            }).then(function () {
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
                function (errors) {
                    console.log("COuld not Upload Sticker..." + errors);
                });
        });

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

    /* var collection = new Parse.Query("Collection");
     collection.first().then(function(sticker){

     sticker.set("stickerName", stickerName);
     sticker.set("localName", stickerName);
     sticker.set("uri", parseFile);
     sticker.set("stickerPhraseImage", "");
     return sticker.save();

     }).then(function(){

     //added categories
     var collection = new Parse.Query("Collection");
     collection.equalTo("objectId", coll_id);
     return collection.find();

     }).then(function(){

     },function(error){

     });*/


    if (session && token) {

        //GET ID OF CURRENT COLLECTION
        var collection = new Parse.Query("Collection");
        collection.equalTo("objectId", coll_id);
        collection.first({sessionToken: token}).then(function (collection) {

            //File saving Process Begins
            files.forEach(function (sticker, index) {

                //TODO update originalname to originalName
                var fullName = sticker.originalname;

                var stickerName = fullName.substring(0, fullName.length - 4);

                //convert file to base64 format
                var bitmap = fs.readFileSync(sticker.path, {encoding: 'base64'});
                var parseFile = new Parse.File(stickerName, {base64: bitmap}, sticker.mimetype);
                console.log("Parse File::::::::::" + JSON.stringify(parseFile));

                //parse file object
                var Sticker = new Parse.Object.extend("Sticker");

                //TODO handle promises
                parseFile.save().then(function () {

                    //instance of parse object
                    var sticker = new Sticker();
                    sticker.set("stickerName", stickerName);
                    sticker.set("localName", stickerName);
                    sticker.set("uri", parseFile);
                    sticker.set("stickerPhraseImage", "");
                    sticker.set("parent", collection);

                    return sticker.save();

                }).then(function () {

                    var collection_relation = collection.relation("Collection");
                    collection_relation.add(sticker);
                    collection.save();

                    //Delete tmp fil after upload
                    var tempFile = sticker.path;
                    fs.unlink(tempFile, function (err) {
                        if (err) {
                            //TODO handle error code
                            console.log("-------Could not del temp" + JSON.stringify(err));
                        }
                    });
                    res.redirect("/collections-dashboard");
                });
            });
            //File saving Process Ends
        });
        res.redirect("/collections-dashboard");

    }
    // //no session exists reload signup page
    else {
        function error(err) {
            console.log("error:::::: " + JSON.stringify(err));
            res.redirect("/");
        }
    }
});

//SELECT CATEGORIES PAGE
app.get('/categories', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {

        //query parse for all categories
        new Parse.Query("Category").find({sessionToken: token}).then(function (categories) {
                categories.forEach(function (cat, index) {
                    console.log("Category" + index + ":::::" + cat);
                });
                res.render("pages/categories", {categories: categories});
            },
            function (error) {
                console.log("No categories found.............." + JSON.stringify(error));
            });
    } else {
        res.redirect("/");
    }
});


app.post('/new-category', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var categoryName = req.body.catname;

    if (session && token) {

        var Category = new Parse.Object.extend("Category");
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

app.post('/update-category', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var newName = req.body.catname;
    var currentName = req.body.currentName;

    if (session && token) {

        var category = new Parse.Query("Category");
        category.equalTo("name", currentName);
        category.first().then(function (category) {

                category.set("name", newName);
                return category.save();

            }.then(function () {

                res.redirect("/categories");

            },
            function (error) {

                console.error(error);
            })
        );
    }
    else { //no session found
        res.redirect("/");
    }

});


app.post('/remove-category', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var currentName = req.body.currentNameD;

    if (session && token) {

        console.log("Category_________: " + JSON.stringify(req.body));

        var category = new Parse.Query("Category");
        category.equalTo("name", currentName);
        category.first().then(function (category) {
                console.log("Categoryyyyyy: " + JSON.stringify(category));
                category.destroy({
                    success: function (object) {
                        console.log("removed" + JSON.stringify(object));
                        res.redirect("/categories");
                    },
                    error: function (error) {
                        console.log("Could not destroy" + error);
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
    res.cookie('token', "");
    res.redirect("/");

});

// Dashboard
app.get('/dashboard', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

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


app.get('/cat', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    Parse.Promise.when(
        new Parse.Query("Category").find({sessionToken: token}),
        new Parse.Query("Sticker").find({sessionToken: token})
    ).then(function (categories, stickers) {

        console.log("CATEGORIES " + JSON.stringify(categories));
        console.log("STICKER " + JSON.stringify(stickers));

        _.each(stickers, function (sticker) {

            var sticker_relation = sticker.relation("cat");
            _.each(categories, function (category) {
                sticker_relation.add(category);
            });

            sticker.save();

        });

        res.send("chicken noodle soup")


    }, function (error) {
        console.log(JSON.stringify(error));
    });


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
                //todo change the column 'collection' in Collection class to 'stickers' in parse dashboard
                var resultArray = [];

                var col = collection.relation("Collection");
                col.query().find({
                    success: function (stickers) {

                        res.render("pages/collection", {stickers: stickers, id: coll_id});
                        Parse.Promise.as().then(function () { // this just gets the ball rolling
                            var promise = Parse.Promise.as(); // define a promise

                            _.each(stickers, function (sticker) { // use underscore, its better :)
                                promise = promise.then(function () { // each time this loops the promise gets reassigned to the function below

                                    var query = sticker.relation("cat");
                                    return query.find().then(function (categories) { // the code will wait (run async) before looping again knowing that this query (all parse queries) returns a promise. If there wasn't something returning a promise, it wouldn't wait.

                                        var _categoryName = [];
                                        _.each(categories, function (category) {
                                            _categoryName.push(category.get("name"))
                                        });
                                        sticker.categoryName = _categoryName;
                                        resultArray.push(sticker);

                                        return Parse.Promise.as(); // the code will wait again for the above to complete because there is another promise returning here (this is just a default promise, but you could also run something like return object.save() which would also return a promise)

                                    }, function (error) {
                                        response.error("score lookup failed with error.code: " + error.code + " error.message: " + error.message);
                                    });
                                }); // edit: missing these guys
                            });
                            return promise; // this will not be triggered until the whole loop above runs and all promises above are resolved

                        }).then(function () {
                            console.log("RESULT ARRAY " + resultArray);
                            res.render("pages/collection", {stickers: resultArray, id: coll_id});
                        }, function (error) {
                            response.error("script failed with error.code: " + error.code + " error.message: " + error.message);
                        });
                    },
                    error: function (error) {
                        //TODO handle error code
                        response.error(error);
                        res.redirect("/collection-dashboard")
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

                    //find categories from dashboard
                    var categories = new Parse.Query("Category");
                    categories = categories.descending("name");

                    categories.find().then(function (categories) {
                            res.render("pages/details", {sticker: sticker, categories: categories});
                        },
                        //TODO handle errors
                        function (error) {
                            console.log("No categories found- " + error);
                        }
                    );
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

    //input fields from form
    var stickerName = req.body.stickername;
    var category = req.body.cat;
    var file = req.file;
    var imgChange = req.body.imgChange;
    var stickerId = req.params.id;

    console.log("BODY-------------------" + JSON.stringify(req.body));

    if (session && token) {

        var categoryQuery = new Parse.Query("Category");

        var categoryArray = category.split(", ");
        //query for existing categories in parse
        categoryArray.forEach(function (category, index) {
            console.log("Item " + [index] + "::: " + category);

            categoryQuery.equalTo("name", category);
            categoryQuery.find().then(function (catgory) {
                    console.log("Category*****************" + JSON.stringify(catgory));

                    var NewSticker = new Parse.Object.extend("Sticker");
                    var sticker = new Parse.Query(NewSticker);
                    sticker.equalTo("objectId", stickerId);
                    sticker.first({sessionToken: token}).then(
                        function (newSticker) {
                            //Update new sticker properties
                            newSticker.set("stickerName", stickerName);
                            newSticker.set("localName", stickerName);
                            newSticker.add("category", catgory);

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
                                    var sticker_relation = catgory.relation("sticker");
                                    sticker_relation.add(newSticker);
                                    catgory.save();

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
                        function (error) {
                            //TODO handle error code
                            console.log("STICKER NOT FOUND: " + JSON.stringify(error))
                        }
                    );
                },
                function (error) {
                    console.error("Error" + error);
                });
        });

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