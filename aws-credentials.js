// Copyright 2021 KappaZeta Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License").
//
// You may not use this file except in compliance with the License. A copy
// of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "license" file accompanying this file. This file is distributed
// on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific language governing
// permissions and limitations under the License.

/* ESLint file-level overrides */
/* global AWS bootbox document moment window $ angular:true */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
/* eslint-disable no-console */
/* eslint no-plusplus: "off" */
/* eslint-env es6 */

console.assert(config.hasOwnProperty('region'), 'config.region missing from app-config.js');
console.assert(config.hasOwnProperty('cognitoDomain'), 'config.cognitoDomain missing from app-config.js');
console.assert(config.hasOwnProperty('userPoolId'), 'config.userPoolId missing from app-config.js');
console.assert(config.hasOwnProperty('identPoolId'), 'config.identPoolId missing from app-config.js');
console.assert(config.hasOwnProperty('appClientId'), 'config.appClientId missing from app-config.js');
console.assert(config.hasOwnProperty('signinCallback'), 'config.signinCallback missing from app-config.js');
console.assert(config.hasOwnProperty('bucket'), 'config.bucket missing from app-config.js');

const poolAddr = 'cognito-idp.' + config.region + '.amazonaws.com/' + config.userPoolId;
const loginLink = 'https://' + config.cognitoDomain + '.auth.' + config.region + '.amazoncognito.com/login?response_type=token&client_id=' + config.appClientID + '&redirect_uri=' + config.signinCallback;

// Take an id_token and request for AWS credentials.
function reqKeys($scope, id_token, region, identPoolId) {
    var loginMap = {};
    loginMap[poolAddr] = id_token;
   
    console.log($scope.settings);

    AWS.config.region = region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identPoolId,
        Logins: loginMap
    });
    
    AWS.config.credentials.clearCachedId();
    AWS.config.credentials.get(function(err) {
        if (err) {
            console.log(err.message);
            if (window.confirm('Failed to acquire the keys.\nThe tokens might be outdated.\nClick OK to head to the login page.')) {
                window.location.href = loginLink;
	    }
        } else {
            $scope.settings.cred.accessKeyId = AWS.config.credentials.accessKeyId;
            $scope.settings.cred.secretAccessKey = AWS.config.credentials.secretAccessKey;
            $scope.settings.cred.sessionToken = AWS.config.credentials.sessionToken;
            $scope.settings.prefix = 'users/' + AWS.config.credentials.identityId + '/';
            // Apply changes, connect to S3, and close the settings dialog.
            $scope.$apply();
            $scope.update();
        }
    });
}

// Extract id_token from query parameters, request for AWS credentials and configure the S3 browser.
function processAWSQueryParams($scope) {
    var idToken = location.hash.split('id_token=')[1].split('&')[0];

    // Fill in parameters from the config file.
    $scope.settings.auth = 'temp';
    $scope.settings.region = config.region;
    $scope.settings.entered_bucket = config.bucket;

    reqKeys($scope, idToken, config.region, config.identPoolId);
}
