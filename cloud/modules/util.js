/**
 * Module for creating temperature needed implementations.
 * It basically serves as a middle on the server.
 */

// moment module to help in date formatting
var moment = require('moment');

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

    if(process.env.VERBOSE === true){

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
    var success = {};
    success[KEY_RESPONSE_CODE] = RESPONSE_OK;
    return success;
};

setResponse = function (data, validate, errorType) {
    var success = {};
    success[KEY_RESPONSE_CODE] = validate ? RESPONSE_OK : errorType;
    success[KEY_DATA] = data;
    return success;
};

setResponseOk = function (data) {
    var success = {};
    success[KEY_RESPONSE_CODE] = RESPONSE_OK;
    success[KEY_DATA] = data;
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


exports.rejectPromise = rejectPromise;
exports.handleError = handleError;
exports.setError = setError;
exports.setSuccess = setSuccess;
exports.setErrorType = setErrorType;
exports.setResponseOk = setResponseOk;
exports.setResponse = setResponse;
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
exports.USER_ERROR = USER_ERROR;
exports.STATUS_OK = STATUS_OK;