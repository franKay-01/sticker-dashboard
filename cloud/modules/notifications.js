let path = require("path");
let fs = require('fs');
let google = require('googleapis');


const PROJECT_ID = 'gsticker-market-place';
const HOST = 'fcm.googleapis.com';
const URL = HOST + '/v1/projects/' + PROJECT_ID + '/messages:send';
const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const SCOPES = [MESSAGING_SCOPE];

let getAccessToken = () => {
    return new Promise(function (resolve, reject) {
        // let key = require(path.join(__dirname, '../..', "service_accounts/tuapa.json"));
        let key = require("../../service_accounts/tuapa.json");
        console.log("KEY " + key.private_key);
        console.log("PRIVATE KEY " + JSON.stringify(key));
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

    console.log("SEND");

    getAccessToken().then((accessToken) => {

        console.log("GET ACCESS TOKEN");

        let message = {
            "message": {
                //TODO create topics to be env specific to avoid sending push to live users
                "topic": opt.topic,
                "notification": {
                    "title": opt.title,
                    "body": opt.description
                },
                "data": {
                    "id": "hgh"
                },
                "android": {
                    "notification": {
                        "click_action": "TOP_STORY_ACTIVITY"
                    }
                },
                "apns": {
                    "payload": {
                        "aps": {
                            "category": "NEW_MESSAGE_CATEGORY"
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
            console.log("FAILED " + httpResponse.status);

            promise.reject(httpResponse.status);
        });


    }, (error) => {
        console.log("ERROR FROM FUNCTION " + error.message);

    });


    return promise;

};

exports.send = send;