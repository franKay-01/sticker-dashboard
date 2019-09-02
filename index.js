//main imports
require("sqreen");
let express = require("express");
let ejs = require("ejs");
let ParseServer = require("parse-server").ParseServer;
let Parse = require("parse/node").Parse; // import the module
let S3Adapter = require("@parse/s3-files-adapter");
const imageUpload = require("./upload.js");

//middleware for sessions and parsing forms
let bodyParser = require("body-parser");
let cookieParser = require("cookie-parser");
let cookieSession = require("cookie-session");
let cors = require("cors");
let methodOverride = require("method-override");

//for parsing location, directory and paths
let path = require("path");
let fs = require("fs");

// Access to all routes
let accountRoute = require("./routes/account");
let advertRoute = require("./routes/adverts");
let storyRoute = require("./routes/story");
let stickerRoute = require("./routes/stickers");
let categoryRoute = require("./routes/categories");
let newsLetterRoute = require("./routes/newsletter");
let reviewRoutes = require("./routes/reviews");
let packRoutes = require("./routes/packs");
let productRoutes = require("./routes/products");
let feedRoutes = require("./routes/feeds");
let experimentRoutes = require("./routes/experiments");
let publishRoutes = require("./routes/publish");
let messageRoutes = require("./routes/messages");
let barcodeRoutes = require("./routes/barcodes");
let projectRoutes = require("./routes/projects");
let reactRoutes = require("./routes/react");

var mailgun = require("mailgun-js")({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

//TODO investigate email template server url links
const PARSE_SERVER_URL = process.env.SERVER_URL;
const PARSE_PUBLIC_URL = process.env.SERVER_URL.replace("parse", "public/");

let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// let databaseUri = config.DATABASE_URI; //for google

Parse.initialize(process.env.APP_ID);
Parse.serverURL = PARSE_SERVER_URL + "/";

/* for google
// Parse.initialize(config.APP_ID);
// Parse.serverURL = config.SERVER_URL;
*/

// console.log("DATABASE "+config.DATABASE_URI);

if (!databaseUri) {
  console.log("DATABASE_URI not specified, falling back to localhost.");
}

let api = new ParseServer({
  //**** General Settings ****//

  databaseURI: databaseUri || "mongodb://localhost:27017/dev",
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + "/cloud/main.js",
  serverURL: PARSE_SERVER_URL || "http://localhost:1337/parse", // Don't forget to change to https if needed
  // serverURL: config.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed

  //**** Security Settings ****//
  allowClientClassCreation: process.env.CLIENT_CLASS_CREATION || false,

  appId: process.env.APP_ID || "myAppId", //For heroku,
  //  clientKey: process.env.CLIENT_KEY || 'clientKey',
  // appId: config.APP_ID || 'myAppId', //For google

  masterKey: process.env.MASTER_KEY || "myMasterKey", //Add your master key here. Keep it secret! //For heroku
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
  publicServerURL: process.env.SERVER_URL || "http://localhost:1337/parse",
  /* This will appear in the subject and body of the emails that are sent */

  appName: process.env.APP_NAME || "Sticker Dashboard", //for heroku
  //appName: config.APP_NAME || 'Sticker Dashboard', // for google

  emailAdapter: {
    // module: 'parse-server-mailgun',
    module: "parse-server-mailgun-adapter-template",

    options: {
      fromAddress: process.env.EMAIL_FROM || "test@example.com",
      domain: process.env.MAILGUN_DOMAIN || "example.com",
      apiKey: process.env.MAILGUN_API_KEY || "apikey",
      // Verification email subject
      verificationSubject: "Please verify your e-mail for %appname%",
      // Verification email body
      // verificationBody: 'Hi,\n\nYou are being asked to confirm the e-mail address %email% with %appname%\n\nClick here to confirm it:\n%link%',
      //OPTIONAL (will send HTML version of email):
      verificationBodyHTML:
        fs.readFileSync("./verification/verification_email.html", "utf8") ||
        null,

      // Password reset email subject
      passwordResetSubject: "Password Reset Request for %appname%",
      // Password reset email body
      // passwordResetBody: 'Hi,\n\nYou requested a password reset for %appname%.\n\nClick here to reset it:\n%link%',
      //OPTIONAL (will send HTML version of email):
      passwordResetBodyHTML:
        fs.readFileSync("./verification/password_reset_email.html", "utf8") ||
        null
    }
  },
  customPages: {
    invalidLink: PARSE_PUBLIC_URL + "templates/invalid_link.html",
    verifyEmailSuccess: PARSE_PUBLIC_URL + "templates/email_verified.html",
    choosePassword: PARSE_PUBLIC_URL + "templates/choose_password.html",
    passwordResetSuccess:
      PARSE_PUBLIC_URL + "templates/password_reset_success.html"
  },
  filesAdapter: new S3Adapter({
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
app.use(bodyParser.json()); // Middleware for reading request body
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(methodOverride());

//TODO seperation of concerns
//app.use(require("./routes/newsletter"));

app.use("/", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  const schema = req.headers["x-forwarded-proto"];

  if (schema === "https") {
    req.connection.encrypted = true;
  }
  next();
});

app.all("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  let schema = req.headers["x-forwarded-proto"];

  if (schema === "https") {
    req.connection.encrypted = true;
  }
  next();
});

app.all("/", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  let schema = req.headers["x-forwarded-proto"];

  if (schema === "https") {
    req.connection.encrypted = true;
  }
  next();
});

// Serve static assets from the /public folder
app.use("/public", express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");

let mountPath = process.env.PARSE_MOUNT || "/parse";
app.use(mountPath, api);

/*
how to use this function parseInstance.setACL(getACL(user,true|false));
* */
function setPermission(user, isPublicReadAccess) {
  let acl = new Parse.ACL(user);
  acl.setPublicReadAccess(isPublicReadAccess);
  return acl;
}

app.post("/upload", imageUpload);

app.get("/testSendEmail", (req, res) => {
  const data = {
    from: "Psyphertxt <noreply@psyphertxt.com>",
    to: ["franciskornu@gmail.com", "fkay0450@gmail.com"],
    subject: "Hello User",
    text: "Testing some Mailgun awesomeness!"
  };

  mailgun.messages().send(data, (error, body) => {
    console.log(body);
  });
});
/*====================================== ACCOUNTS ============================*/
reactRoutes(app);
/*====================================== ACCOUNTS ============================*/

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

let port = process.env.PORT || 1337;
let httpServer = require("http").createServer(app);
httpServer.listen(port, function() {
  console.log("parse-server-example running on port " + port + ".");
});
