var _ = require('alloy/underscore')._,
    Cloud = require('ti.cloud');
    
var Q; try {Q = require('q');} catch(e) { Q = require(Alloy.CFG.TiAuth.lib.Q);}

    
var ERRORS = {
    401: L('incorrect_login_or_password') || 'Login or password is incorrect'
};

exports.name = "ACS";
exports.authenticate = function(credentials) {    
    if(!(credentials.hasOwnProperty('login') && 
        credentials.hasOwnProperty('password'))) {
            throw new TypeError();
        }
        
    var deferred = Q.defer();
    
    Cloud.Users.login(credentials, function (e) {        
        if (e.success) {
            deferred.resolve(e.users[0]);
        } else {                      
            deferred.reject(e.error && (ERRORS[e.code] || e.message));
        }
    });
    
    return deferred.promise;
};

exports.logout = function() {
    var deferred = Q.defer();
    
    Cloud.Users.logout(function (e) {
        if (e.success) {           
            deferred.resolve();            
        } else {
            deferred.reject(e);        
        }
    });    
    
    return deferred.promise;
};