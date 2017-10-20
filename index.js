let express = require('express');
let ParseServer = require('parse-server').ParseServer;
let S3Adapter = require('parse-server').S3Adapter;
let SimpleSendGridAdapter = require('parse-server-sendgrid-adapter');
let path = require('path');
let cors = require('cors');
let Parse = require("parse/node"); // import the module
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
let fs = require('fs');
let multer = require('multer');
let _ = require('underscore');
let helper = require('./cloud/modules/helpers');
let methodOverride = require('method-override');
let multipart = require('multipart');
let i2b = require("imageurl-base64");
let download = require('image-downloader');
// var urlToImage = require('url-to-image');

// var busboy = require('connect-busboy');


let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

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
    var token = req.cookies.token;

    if (session && token) {
        res.redirect("/dashboard");
    } else {
        res.redirect("/login");
    }
});

app.get('/login', function(req, res){
    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token){
        res.redirect("/dashboard");
    }else{
        let query = new Parse.Query("Sticker");
        query.limit(40);
        query.find({sessionToken: token}).then(function (cards) {
            /*_.each(cards, function (sticker) {
             cardDetails = items[Math.floor(Math.random()*sticker.length)];
            });*/
            cards = helper.shuffle(cards);
            cards = cards.slice(0, 3);

            res.render("pages/login", {stickers:cards });

        }, function (error) {

            console.log("logIn error" + JSON.stringify(error));

        });
    }
});

app.get('/home', function(req, res){
    var session = req.session.token;
    var token = req.cookies.token;
    var pack = [];
    var pack_category = [];

    if (session && token) {
        const limit = 3;
         Parse.Promise.when(
            new Parse.Query("Collection").limit(limit).find({sessionToken: token}),
            new Parse.Query("Category").limit(limit).find({sessionToken: token})
        ).then(function(collection,categories){
            let _collection = [];
            let _categories = [];
            if(collection.length) {
                _collection = collection;

            }
            if(categories.length) {
                _categories = categories;

            }

            res.render("pages/home", {collections:_collection,categories:_categories });

        },function(error){
            console.log(JSON.stringify(error));
            res.redirect("/dashboard");
        });

    } else {
        res.redirect("/dashboard");
    }
});

// Testing something FRANCIS
app.get('/increment', function(req, res){
    var session = req.session.token;
    var token = req.cookies.token;
  // collection.equalTo("objectId", coll_id).first({sessionToken: token}).then(function (collection) {
    if (session && token) {
    var query = new Parse.Object.extend("Post");
    var Query = new Parse.Query(query);
    Query.limit(1);
    Query.get("numComments").then(function(post){

        console.log("FIRST POST "+ JSON.stringify(post));
        Query.increment("numComments");
        return Query.save();

    }).then(function (next) {

        console.log("SECOND POST "+ JSON.stringify(next));
        res.render("pages/home");
    });
    
}else{
        res.redirect("/dashboard");
    }
});

//login the user in using Parse
app.post('/login', function (req, res) {

    let username = req.body.username;
    let password = req.body.password;

    Parse.User.logIn(username, password).then(function (user) {

        console.log("SESSIONS TOKEN " + user.getSessionToken());

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

    let session = req.session.token;
    let token = req.cookies.token;

    let files = req.files;

    if (session && token) {
        files.forEach(function (sticker, index) {

            let fullname = sticker.originalname;

            //remove file extension name
            let stickerName = fullname.substring(0, fullname.length - 4);

            //converts uploaded file to base64 format
            let bitmap = fs.readFileSync(sticker.path, {encoding: 'base64'});

            let parseFile = new Parse.File(stickerName, {base64: bitmap}, sticker.mimetype);

            //create parse file object
            let Sticker = new Parse.Object.extend("Sticker");

            parseFile.save().then(function () {

                //instance of parse object
                let sticker = new Sticker();
                sticker.set("stickerName", stickerName);
                sticker.set("localName", stickerName);
                sticker.set("uri", parseFile);
                sticker.set("stickerPhraseImage", "");

                return sticker.save();

            }).then(function () {
                    //Delete tmp file after upload
                    let tempFile = sticker.path;
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

//TODO dropbox API
/*app.post('/dropbox', upload.array('im1[]'), function (req, res) {

})*/

app.post('/upload_dropbox', upload.array('box'), function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var coll_id = req.body.coll_id;
    var files = req.files;
    var fileDetails = [];
    var stickerDetails = [];
    var stickerCollection;

    console.log("FILE" + files + " COLL_ID " + coll_id);

// var download = function(uri, filename, callback){
//   request.head(uri, function(err, res, body){
//     console.log('content-type:', res.headers['content-type']);
//     console.log('content-length:', res.headers['content-length']);

//     request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
//   });
// };

// download('https://www.google.com/images/srpr/logo3w.png', 'google.png', function(){
//   console.log('done');
// });

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
    // console.log("FILES" + req.files + "COLL_ID "+ coll_id);
    if (session && token) {

        var collection = new Parse.Query("Collection");
        collection.equalTo("objectId", coll_id).first({sessionToken: token}).then(function (collection) {
            console.log("INSIDE COLLECTION");
            stickerCollection = collection;

            files.forEach(function (file) {

                //TODO update originalname to originalName
                var fullName = file.originalname;
                var stickerName = fullName.substring(0, fullName.length - 4);

                var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
                console.log("BITMAP FROM DERRYCK'S CODE " + JSON.stringify(bitmap));
                //create our parse file
                var parseFile = new Parse.File(stickerName, {base64: bitmap}, file.mimetype);
                console.log("PARSEFILE " + JSON.stringify(parseFile)+ " name "+stickerName+" collection "+JSON.stringify(collection));
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
});

//SELECT CATEGORIES PAGE
app.get('/categories', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {

        //query parse for all categories
        new Parse.Query("Category").find({sessionToken: token}).then(function (categories) {
                /* categories.forEach(function (cat, index) {
                     console.log("Category" + index + ":::::" + JSON.stringify(cat));
                 });*/
                console.log("FIRST ID: " + JSON.stringify(categories[0].id));
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
    //TODO update naming conventions
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
    var currentId = req.body.categoryId;

    if (session && token) {

        var category = new Parse.Query("Category");
        //objectId
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


app.post('/remove-category', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var removeId = req.body.inputRemoveId;

    if (session && token) {

        console.log("Category_________: " + JSON.stringify(req.body));

        var category = new Parse.Query("Category");
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
    //res.cookie('token', "");
    //req.session.destroy();
    res.clearCookie('token');
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

app.get('/second_dashboard', function(req, res){
    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {

        new Parse.Query("Sticker").find({sessionToken: token}).then(function (stickers) {

            res.render("pages/dashboard_2", {stickers: stickers});

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

app.get('/pack_collection', function(req, res){
    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {
        let query = new Parse.Query("Collection");
        query.limit(3);
        query.find({sessionToken: token}).then(function (collections) {

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

app.get('/collections-dashboard', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

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

//this route adds all categories to each sticker in the database
//TODO delete this route
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

            var sticker_relation = sticker.relation("categories");
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


//Displays all stickers belonging to a selected collection
app.get('/collection/:id', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;
    var coll_id = req.params.id;

    if (session && token) {

        var collection = new Parse.Query("Collection");
        collection.get(coll_id, {
            success: function (collection) {
                var coll_name = collection.get("name");
                //todo change the column 'collection' in Collection class to 'stickers' in parse dashboard

                var col = collection.relation("Collection");
                col.query().find().then(function (stickers) {

                    res.render("pages/collection", {stickers: stickers, id: coll_id, collectionName: coll_name});

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

        collection.save().then(function () {

            res.redirect('/collections-dashboard');

        });
    }
    else {
        res.redirect("/");
    }
});


//EDIT/STICKER DETAILS
app.get('/details/:id', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;
    var id = req.params.id;
    var stickerDetail;
    var allCategories;

    if (session && token) {

        Parse.Promise.when(
            new Parse.Query("Sticker").equalTo("objectId", id).first({sessionToken: token}),
            new Parse.Query("Category").find()
        ).then(function (sticker, categories) {

                stickerDetail = sticker;
                allCategories = categories;

                var sticker_relation = sticker.relation("categories");
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
                categories: allCategories
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

//Update Sticker
app.post('/update/:id', upload.single('im1'), function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    //input fields from form
    var stickerName = req.body.stickerName;
    var categoryList = req.body.cat1;
    var file = req.file;
    var imgChange = req.body.imgChange;
    var stickerId = req.params.id;

    if (session && token) {

        Parse.Promise.when(
            new Parse.Query("Sticker").equalTo("objectId", stickerId).first(),
            new Parse.Query("Category").containedIn("objectId", categoryList).find()
        ).then(function (sticker, categories) {

            var sticker_relation = sticker.relation("categories");

            _.each(categories, function (category) {

                console.log("ADDED CATEGORY" + category);
                sticker_relation.add(category);

            });

            //if image has been changed
            if (imgChange === 'true') {

                //Update new sticker properties
                sticker.set("stickerName", stickerName);
                sticker.set("localName", stickerName);

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
            res.redirect("/dashboard");

        }, function (e) {
            console.log("SERVER ERROR " + JSON.stringify(e));
            res.redirect("/dashboard");

        });

    } else {

        //TODO handle error code
        console.log("No session found[[[[[[");
        res.redirect("/");

    }
});

app.get('/upload_page', function (req, res) {
    res.render("pages/upload");
});

app.post('/upload-file', function (req, res) {

    var bitmap;
    var name;
    var fileUrl;
    var session = req.session.token;
    var token = req.cookies.token;
    var coll_id = req.body.coll_id;
    var stickerCollection;
    var jpeg = "image/jpeg";
    var png = "image/png";
    var mimetype;

    if (session && token) {
        var type = req.body.file;
        type = type.toLowerCase();
        if (type === 'jpg') {
            mimetype = jpeg;
            console.log("MIMETYPE WAS SET TO JPEG");
        } else if (type === 'png') {
            mimetype = png;
            console.log("MIMETYPE WAS SET TO PNG");
        }
        name = req.body.fileName;
        fileUrl = req.body.fileUrl; // receive url from form
        name = name.substring(0, name.length - 4);

        var options = {
             url: fileUrl,
             dest: __dirname+'/public/uploads/'+ req.body.fileName
        }

        download.image(options)
          .then(({ filename, image }) => {
            console.log('FILE SAVED TO ', filename);
            bitmap = fs.readFileSync(filename, {encoding: 'base64'});
            // fs.readFile(filename, function(err, data){
            // if (err) {
            //     console.log("NOT NOT "+err);
            // }else{
                // bitmap = new Buffer(data).toString('base64');
                // console.log("BASE64 FROM FILE IN FOLDER"+JSON.stringify(base64data));
                var collection = new Parse.Query("Collection");
             collection.equalTo("objectId", coll_id)
                .first({sessionToken: token})
                .then(function (collection) {
                    console.log("BITMAP PASSED BY FILE "+bitmap);
                    console.log("NAME "+name+" collection "+JSON.stringify(collection));
                    stickerCollection = collection;
                    var parseFile = new Parse.File(name, {base64: bitmap});
                    console.log("PARSEFILE "+JSON.stringify(parseFile)+ " name "+name+" collection "+JSON.stringify(collection));
                    // console.log("FILE PASSED " + JSON.stringify(file));
                    var Sticker = new Parse.Object.extend("Sticker");
                    var sticker = new Sticker();
                    sticker.set("stickerName", name);
                    sticker.set("localName", name);
                    sticker.set("uri", parseFile);
                    sticker.set("stickerPhraseImage", "");
                    sticker.set("parent", collection);

                    console.log("LOG BEFORE SAVING STICKER");

                    return sticker.save();


                }).then(function (sticker) {
                console.log("STICKER FROM PARSEFILE "+JSON.stringify(sticker));
                var collection_relation = stickerCollection.relation("Collection");
                collection_relation.add(sticker);
                console.log("LOG BEFORE SAVING STICKERCOLLECTION");
                fs.unlink(filename, function (err) {
                 if (err) {
                     //TODO handle error code
                     console.log("Could not del temp++++++++" + JSON.stringify(err));
                     }
                 });

                return stickerCollection.save();

            }).then(function () {

                console.log("REDIRECT TO DASHBOARD");
                res.redirect("/");

            }, function (error) {
                console.log("BIG BIG ERROR" + error.message);
                res.redirect("/");
            });
                 // }
                // });
              }).catch((err) => {
                throw err;
              });

        // i2b(fileUrl, function (err, data) {
        //     if (err) {
        //         console.log("ERROR occurred when converting");
        //         res.redirect("/");
        //     } else {
        //         console.log("NEW BASE " + JSON.stringify(data.base64));

        // Convert url link to base64 encoded data
         // var newPath = __dirname + "/public/uploads/" + req.body.fileName;
         // fs.readFile(newPath, function(err, data){
         //    if (err) {
         //        console.log("NOT NOT "+err);
         //    }else{
         //        // bitmap = fs.readFileSync(newPath, {encoding: 'base64'});
         //        // console.log("FILE FROM FS "+JSON.stringify(bitmap));
         //        console.log(JSON.stringify(data));
         //    }
         // });
        //     }
        // });



    } else {

        res.redirect("/");

    }

});

/*
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
 * */

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
});


// This will enable the Live Query real-time server
// ParseServer.createLiveQueryServer(httpServer);