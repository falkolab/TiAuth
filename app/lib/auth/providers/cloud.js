var _ = require('alloy/underscore')._,
    Q = require('q'),
    Cloud = require('ti.cloud'),
    Auth = require('auth/auth');
    
var ERRORS = {
    401: 'Логин или пароль введен неверно'
};

exports.authenticate = function(credentials) {
    var deferred = Q.defer();  
    if(!(credentials.hasOwnProperty('login') && 
        credentials.hasOwnProperty('password'))) {
            throw new TypeError();
        }
    
    Cloud.Users.login(credentials, function (e) {        
        if (e.success) {            
            var user = new Auth.BaseUser();
            _.extend(user, e.users[0]);
            // Ti.API.debug('Success:\n' +
                // 'id: ' + user.id + '\n' +
                // 'sessionId: ' + Cloud.sessionId + '\n' +
                // 'first name: ' + user.first_name + '\n' +
                // 'last name: ' + user.last_name);
                deferred.resolve(user);
        } else {
            Ti.API.error('Ошибка при вызове cloud login: ' +
                ((e.error && e.message) || JSON.stringify(e)));          
            deferred.reject(e.error && (ERRORS[e.code] || e.message));
        }
    });
    
    return deferred.promise;
};