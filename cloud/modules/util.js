/**
 * It basically serves as a middle on the server.
 */

// Include the Twilio Cloud Module to send sms messages
let twilio = require("twilio")("AC6bad1c4bf8d48125709add2b8b0a5ce0", "33028731ba2e2bfb477a0709582a49f8");
let moment = require('moment');
var _ = require('underscore');
let gm = require('gm').subClass({imageMagick: true});

//TODO update response errors
let KEY_RESPONSE_CODE = "responseCode";
let KEY_RESPONSE_MESSAGE = "responseMessage";
let KEY_DATA = "data";
let RESPONSE_OK = 0;
let STATUS_OK = 200;
let SERVER_ERROR = 1;
let UNKNOWN_ERROR = -1;
let TEXT_MESSAGE_ERROR = 2;
let TOKEN_ERROR = 3;
let HASH_ERROR = 4;
let STORIES_ERROR = 5;
let SETUP_USER_ERROR = 6;
let USER_ERROR = 7;
let GETTING_RECORDS_ERROR = 8;

let CREATING_TEST_ERROR = 9;
let CREATING_TASK_ERROR = 10;
let CLASS_TYPE_ERROR = 11;

let UPDATING_TEST_ERROR = 12;
let UPDATING_TASK_ERROR = 13;

let DELETING_TEST_ERROR = 14;
let DELETING_TASKS_ERROR = 15;
let GETTING_TASKS_ERROR = 16;

let STORY_PREVIEW_ERROR = 17;

/**
 * Creates a function to reject the given promise
 * @param p
 * @returns {Function}
 */
rejectPromise = function (p) {
    return function (err) {
        p.reject(err);
    };
};

Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function () {
        return "Line Number " + __stack[1].getLineNumber();
    }
});

/*
 *  util.prettyLoggerJSON(error,
 util.prettyLoggerOptions("ALL BADGES ERROR"));
 * */

/**
 * a wrap around console.log to provide newlines for readability for cloud code logs
 * @param log any object {}
 * @param opt available formatting options
 */
prettyLogger = function (log, opt) {

    if (process.env.VERBOSE === true) {

        var name = "PRETTY LOGGER";
        var newline = "";

        if (opt !== undefined) {
            if (opt.name.length) {
                name = opt.name;
            }
            if (opt.newline) {
                newline = "\n\n";
            }
        }

        var line = [
            "\n\n/==================================== ",
            name,
            " - ",
            moment(new Date().getTime()).format("MMMM DD, YYYY - hh:mm a"),
            " - ",
            " ====================================/\n\n"
        ];

        return console.log(line.join("") + [" ", log, line.join(""), newline].join(""));

    }
};

prettyLoggerJSON = function (log, opt) {
    return prettyLogger(JSON.stringify(log), opt);
};

prettyLoggerOptions = function (_name, _newline) {
    return {
        name: _name,
        newline: _newline || false
    };
};

/**
 * appends an error code so we can well manage errors on client devices
 * @param error
 * @param type
 */
setError = function (error, type) {
    error[KEY_RESPONSE_CODE] = type;
    return error;
};

/**
 * creates an error object to help in managing cloud code errors
 * @param type
 * @returns {{error: {responseCode: *}}}
 */
setErrorType = function (type) {
    return {
        "responseCode": type
    };
};

setSuccess = function () {
    let success = {};
    success[KEY_RESPONSE_CODE] = RESPONSE_OK;
    return success;
};

setResponse = function (data, validate, errorType) {
    let success = {};
    success[KEY_RESPONSE_CODE] = validate ? RESPONSE_OK : errorType;
    success[KEY_DATA] = data;
    return success;
};

setResponseOk = function (data) {
    let success = {};
    success[KEY_RESPONSE_CODE] = RESPONSE_OK;
    success[KEY_DATA] = data;
    console.log("SUCCESS SERVER RESPONSE " + JSON.stringify(success));
    return success;
};


/**
 * Handle cloud code API errors
 * @param res
 * @param error
 */
handleError = function (res, error) {

    prettyLogger(JSON.stringify(error), prettyLoggerOptions("ERROR"));

    if (error === undefined) {
        error = {};
    }
    if (error.hasOwnProperty("message")) {
        res.error({
            KEY_RESPONSE_CODE: UNKNOWN_ERROR,
            KEY_RESPONSE_MESSAGE: "Service Unavailable"
        });
    } else {
        if (!error[KEY_RESPONSE_CODE]) {
            error[KEY_RESPONSE_CODE] = SERVER_ERROR;
        }
        if (!error[KEY_RESPONSE_MESSAGE]) {

            switch (error[KEY_RESPONSE_CODE]) {

                case SERVER_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Service Unavailable";
                    break;

                case TOKEN_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Couldn't generate token";
                    break;

                case HASH_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Couldn't generate hash";
                    break;

                case STORIES_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "No stories found";
                    break;

                case SETUP_USER_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Error setting up user";
                    break;

                case USER_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "User not found";
                    break;

                case GETTING_RECORDS_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "No Records Found";
                    break;

                case GETTING_TASKS_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "No Tasks Found";
                    break;

                case CREATING_TEST_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Error creating test";
                    break;

                case UPDATING_TEST_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Error updating test";
                    break;

                case DELETING_TEST_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Error deleting test or no test to delete";
                    break;

                case CREATING_TASK_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Error creating task";
                    break;

                case UPDATING_TASK_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Error updating task";
                    break;

                case DELETING_TASKS_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Error deleting tasks or no tasks to delete";
                    break;

                case CLASS_TYPE_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "No class type was specified. Check parameters";
                    break;


                case STORY_PREVIEW_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "Stories wasn't found";
                    break;


                default :
                    error[KEY_RESPONSE_CODE] = UNKNOWN_ERROR;
                    error[KEY_RESPONSE_MESSAGE] = "Couldn't process request";
                    break;
            }
        }

        prettyLoggerJSON(error, prettyLoggerOptions("DEVELOPER::HANDLE CALLED ERROR"));
        res.success(error);
    }
};

sendSMS = function (number, message, callback) {

    //send user confirmation code using twilio
    twilio.sendSms({
        from: "8128944274",
        to: number,
        body: message

    }, function (error) {
        if (error) {
            // if number is invalid --> application level error
            // if sending failed for valid number --> server level error
            callback({
                "responseCode": TEXT_MESSAGE_ERROR,
                "responseMessage": "failed to send message"
            });
        } else {
            console.log("message sent", __line);
            callback(null);
        }
    });
};

sendValidationCode = function (number) {
    var promise = new Parse.Promise();
    //generate a random 4 number verification code
    var code = Math.floor(1000 + Math.random() * 9000);
    var message = "Your Cyfa validation code is " + code + ".";

    console.log("Sending validation code");
    sendSMS(number, message, function (err) {
        if (err) {
            promise.reject(err);
        } else {
            promise.resolve(code);
        }
    });

    return promise;
};

exports.page = (items, id) => {

    //TODO include key in params when expansion is needed
    let _page = {
        next: "",
        previous: ""
    };

    if (items.length > 0) {

        let n = items.findIndex(item => item.id === id);
        let p = n;

        n = n + 1; // increase i by one
        n = n % items.length; // if we've gone too high, start from `0` again
        _page.next = items[n].id; // give us back the item of where we are now

        if (p === 0) { // i would become 0
            p = items.length; // so put it at the other end of the array
        }
        p = p - 1; // decrease by one
        _page.previous = items[p].id; // give us back the item of where we are now

    }

    return _page
};

let getMimeType = mimeType => {
    switch (mimeType) {
        case "image/jpg" || "image/jpeg" :
            return ".jpeg";

        case "image/png" :
            return ".png";

        case "image/gif" :
            return ".gif";

    }

    return ".png";
};

exports.thumbnail = (files,size) => {

    if(!size) {
        size = 200
    }

    let promise = new Parse.Promise();
    let filePreviews = [];

    files.forEach(function (file, index) {

        let fullName = file.originalname;
        fullName = fullName.replace(/[`~!@#$%^&*()_|+\-=÷¿?;:'",.23<>\{\}\[\]\\\/]/gi, '');
        let image_name = fullName.substring(0, fullName.length - 4);

        gm(file.path)
            .resize(size, size)
            .write('public/uploads/' + image_name + getMimeType(file.mimetype), function (err) {
                if (!err) {
                    filePreviews.push(
                        {
                            name: image_name,
                            path: 'public/uploads/' + image_name + getMimeType(file.mimetype),
                            mimetype: file.mimetype

                        });
                    if (index === files.length - 1) {
                        promise.resolve(filePreviews);
                    } else {
                        if (index === files.length - 1) {
                            promise.reject(err);
                        }
                    }
                }

            });
    });

    return promise;
};

exports.rejectPromise = rejectPromise;
exports.handleError = handleError;
exports.setError = setError;
exports.setSuccess = setSuccess;
exports.setErrorType = setErrorType;
exports.setResponseOk = setResponseOk;
exports.setResponse = setResponse;
exports.sendValidationCode = sendValidationCode;
exports.prettyLogger = prettyLogger;
exports.prettyLoggerJSON = prettyLoggerJSON;
exports.getMimeType = getMimeType;

//make error messages and codes as public vars
exports.KEY_RESPONSE_CODE = KEY_RESPONSE_CODE;
exports.KEY_RESPONSE_MESSAGE = KEY_RESPONSE_MESSAGE;
exports.RESPONSE_OK = RESPONSE_OK;
exports.SERVER_ERROR = SERVER_ERROR;
exports.UNKNOWN_ERROR = UNKNOWN_ERROR;
exports.TEXT_MESSAGE_ERROR = TEXT_MESSAGE_ERROR;
exports.TOKEN_ERROR = TOKEN_ERROR;
exports.HASH_ERROR = HASH_ERROR;
exports.STORIES_ERROR = STORIES_ERROR;
exports.SETUP_USER_ERROR = SETUP_USER_ERROR;
exports.GETTING_RECORDS_ERROR = GETTING_RECORDS_ERROR;
exports.GETTING_TASKS_ERROR = GETTING_TASKS_ERROR;
exports.USER_ERROR = USER_ERROR;
exports.CREATING_TEST_ERROR = CREATING_TEST_ERROR;
exports.CREATING_TASK_ERROR = CREATING_TASK_ERROR;
exports.UPDATING_TEST_ERROR = UPDATING_TEST_ERROR;
exports.UPDATING_TASK_ERROR = UPDATING_TASK_ERROR;
exports.DELETING_TEST_ERROR = DELETING_TEST_ERROR;
exports.DELETING_TASKS_ERROR = DELETING_TASKS_ERROR;
exports.CLASS_TYPE_ERROR = CLASS_TYPE_ERROR;
exports.STORY_PREVIEW_ERROR = STORY_PREVIEW_ERROR;
exports.STATUS_OK = STATUS_OK;