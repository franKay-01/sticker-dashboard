/**
 * Module for creating temperature needed implementations.
 * It basically serves as a middle on the server.
 */

// Include the Twilio Cloud Module to send sms messages
var twilio = require("twilio")("AC6bad1c4bf8d48125709add2b8b0a5ce0", "33028731ba2e2bfb477a0709582a49f8");
var moment = require('moment');

//TODO update response errors
var KEY_RESPONSE_CODE = "responseCode";
var KEY_RESPONSE_MESSAGE = "responseMessage";
var KEY_DATA = "data";
var RESPONSE_OK = 0;
var STATUS_OK = 200;
var SERVER_ERROR = 1;
var UNKNOWN_ERROR = -1;
var TEXT_MESSAGE_ERROR = 2;
var TOKEN_ERROR = 3;
var HASH_ERROR = 4;
var CONTACTS_ERROR = 5;
var SETUP_USER_ERROR = 6;
var USER_ERROR = 7;
var GETTING_RECORDS_ERROR = 8;

var CREATING_TEST_ERROR = 9;
var CREATING_TASK_ERROR = 10;
var CLASS_TYPE_ERROR = 11;

var UPDATING_TEST_ERROR = 12;
var UPDATING_TASK_ERROR = 13;

var DELETING_TEST_ERROR = 14;
var DELETING_TASKS_ERROR = 15;
var GETTING_TASKS_ERROR = 16;

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

                case CONTACTS_ERROR :
                    error[KEY_RESPONSE_MESSAGE] = "No contacts found";
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
                    error[KEY_RESPONSE_MESSAGE] = "Story wasn't found";
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
exports.prettyLoggerOptions = prettyLoggerOptions;

//make error messages and codes as public vars
exports.KEY_RESPONSE_CODE = KEY_RESPONSE_CODE;
exports.KEY_RESPONSE_MESSAGE = KEY_RESPONSE_MESSAGE;
exports.RESPONSE_OK = RESPONSE_OK;
exports.SERVER_ERROR = SERVER_ERROR;
exports.UNKNOWN_ERROR = UNKNOWN_ERROR;
exports.TEXT_MESSAGE_ERROR = TEXT_MESSAGE_ERROR;
exports.TOKEN_ERROR = TOKEN_ERROR;
exports.HASH_ERROR = HASH_ERROR;
exports.CONTACTS_ERROR = CONTACTS_ERROR;
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