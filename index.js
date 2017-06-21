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
var Base64 = require('node-base64-image');
// var busboy = require('connect-busboy');


var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

Parse.initialize("cryptic-waters12");
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
// var uploads = multer();
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

        console.log(error);
        //error goes here
        res.redirect("/", {
            error: error.message
        });
    });
});

//Upload File To Parse
app.post('/uploads', upload.single('ffile'), function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    console.log("FILE INFO " + JSON.stringify(req.file));
    console.log("BODY INFO " + JSON.stringify(req.body));


    // var tempPath = req.files.file.path;
    // //input fields from form
    var stickerName = req.body.stickername;
    var localName = req.body.localname;
    var category = req.body.cat;
    var file = req.file;
    // console.log("Sticker NAME " + JSON.stringify(stickerName));
    // console.log("Local NAME " + JSON.stringify(localName));
    // console.log("category NAME " + JSON.stringify(category));
    // console.log("file " + JSON.stringify(file));


    if (session && token) {

        //save parsefile object to dashboard
        //save img as obj in base64 format
        /* var data = JSON.stringify(file);
         var newFile = new Buffer(data).toString("base64");

         try {
         var ndata = fs.readFileSync(newFile, 'base64');
         console.log('ndata=========' + ndata);
         } catch(e) {
         console.log('ReadFileSync Error:::', e);
         }

         var StickerObject = new Parse.Object.extend("Stickers");
         stickerName += ".png";*/
        //var write = fs.createWriteStream(file);
        var bitmap = fs.readFileSync(file.path, {encoding: 'base64'});
        // convert binary data to base64 encoded string
        var buffer = new Buffer(bitmap).toString('base64');
        console.log(buffer);
        var parseFile = new Parse.File(stickerName, bitmap);
        console.log("Parse File::::::::::" + JSON.stringify(parseFile));

        parseFile.save().then(function () {
            console.log('success!!!!');
            res.redirect("/dashboard");

            //     var sticker = new StickerObject();
            //     sticker.set("stickerName",stickerName);
            //     sticker.set("localName",localName);
            //     sticker.set("uri",parseFile);
            //     sticker.set("category",category);
            //     sticker.set("stickerPhraseImage", "");
            //     sticker.save().then(function()
            //         {
            //             //file has been uploaded
            //             console.log("image uploaded to parse");
            //         },
            //         function(problem)
            //         {
            //             //sticker was not uploaded
            //             console.error("Could not upload file__ " + problem);
            //         });
        }, function (err) {
            //sticker object was not saved
            console.error("Obj not saved: " + err);
            //return to dashboard page
            res.redirect("/dashboard");
            // res.redirect("/stickers");
        });
    }
    // //no session exists reload stickers page
    // else {
    //     function error(err) {
    //         console.log("error:::::: " + err);
    //         console.log("problem==========="+req.body.stickername);
    //         res.redirect("/stickers", {
    //             error: err.message
    //         });
    //     }
    // }
});

//res.sendFile(path.join(__dirname, '/public/index.ejs'));
// res.render("pages/index");

app.get('/logout', function (req, res) {

    Parse.User.logOut().then(function () {
            res.redirect("/signup");
            res.cookie('token', "");
        },
        function (error) {

            console.log(JSON.stringify(error));
        });

});

// Dashboard
app.get('/dashboard', function (req, res) {

    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {

        new Parse.Query("Sticker")
            .find({sessionToken: token}).then(function (stickers) {

            res.render("pages/dashboard", {stickers: stickers});

        }, function (error) {

            console.log("stickers error" + error);

        });

    } else {

        res.render("pages/signup");
    }

});

// Add Stickers
app.get('/stickers', function (req, res) {
    var session = req.session.token;
    var token = req.cookies.token;

    if (session && token) {
        res.render("pages/stickers");
    } else {
        res.redirect("/");
    }

});


var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
});


// This will enable the Live Query real-time server
// ParseServer.createLiveQueryServer(httpServer);