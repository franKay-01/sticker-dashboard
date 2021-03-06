let path = require("path");
let fs = require('fs');
let google = require('googleapis');


const PROJECT_ID = 'gsticker-market-place';
const HOST = 'https://fcm.googleapis.com';
const URL = HOST + '/v1/projects/' + PROJECT_ID + '/messages:send';
const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const SCOPES = [MESSAGING_SCOPE];

let getAccessToken = () => {
    return new Promise(function (resolve, reject) {
        // let key = require(path.join(__dirname, '../..', "service_accounts/cyfa.json"));
        let key = require("../../service_accounts/cyfa.json");
        let jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            SCOPES,
            null
        );
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens.access_token);
        });
    });
};

let send = (opt) => {

    let promise = new Parse.Promise();

    getAccessToken().then((accessToken) => {

        let message = {
            "message": {
                //TODO create topics to be env specific to avoid sending push to live users
                "topic": opt.topic,
                "notification": {
                    "title": opt.title,
                    "body": opt.description
                },
                "data": opt.data,
                "android": {
                    "notification": {
                        "click_action": opt.activity
                    }
                },
                "apns": {
                    "payload": {
                        "aps" : {
                            "category" : "NEW_MESSAGE_CATEGORY",
                            "badge" : 1,
                        }
                    }
                }
            }
        };

        Parse.Cloud.httpRequest({
            "method": "POST",
            "url": URL,
            "headers": {
                'Authorization': 'Bearer ' + accessToken,
                "Content-Type": "application/json"
            },
            body: message
        }).then(function (httpResponse) {
            console.log("SUCCESSFUL " + JSON.stringify(httpResponse));

            promise.resolve(httpResponse)
        }, function (httpResponse) {
            console.log("FAILED NOTIFY" + JSON.stringify(httpResponse));

            promise.reject(httpResponse.status);
        });


    }, (error) => {
        console.log("ERROR FROM getAccessToken " + error.message);

    });


    return promise;

};

exports.send = send;