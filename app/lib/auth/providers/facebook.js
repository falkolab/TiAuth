var _ = require('alloy/underscore')._,
    Q = require('q'),
    Cloud = require('ti.cloud');
        
var ERRORS = {};

exports.authenticate = function(credentials) {
    var deferred = Q.defer();
    if(!credentials.hasOwnProperty('accessToken')) throw new TypeError();        
        
    Cloud.SocialIntegrations.externalAccountLogin({
            type : 'facebook',
            token : credentials.accessToken
        }, function(e) {            
            if (e.success) {
                var user = e.users[0];
                // Ti.API.debug('Success:\n' +
                // 'id: ' + user.id + '\n' +
                // 'sessionId: ' + Cloud.sessionId + '\n' +
                // 'first name: ' + user.first_name + '\n' +
                // 'last name: ' + user.last_name);
                deferred.resolve(user);
            } else {
                // Ti.API.error('Ошибка при вызове Cloud.SocialIntegrations.externalAccountLogin:\n' +
                // ((e.error && e.message) || JSON.stringify(e)));
                Ti.API.warn(JSON.stringify(e));
                deferred.reject(e.error && (ERRORS[e.code] || e.message));
            }
    });
    
    return deferred.promise;
};