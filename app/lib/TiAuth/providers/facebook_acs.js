var _ = require('alloy/underscore')._,
    Cloud = require('ti.cloud');
    fb = require('facebook');
    
var Q; try {Q = require('q');} catch(e) { Q = require(Alloy.CFG.TiAuth.lib.Q);}

        
var ERRORS = {};

exports.name = "facebook_acs";
exports.authenticate = function authenticate(credentials) {        
    var deferred = Q.defer();        
    
    if(!fb.loggedIn && _.isUndefined(credentials)) {        
        var loginHandler = function(e) {                
            fb.removeEventListener('login', loginHandler);            
            if (e.success) {                
                deferred.resolve(authenticate({
                    accessToken: fb.accessToken            
                }));                            
            } else if (e.cancelled) {
                deferred.reject("User canceled Facebook login");
            } else {
                deferred.reject(e);
            }
        };        
        fb.addEventListener('login', loginHandler);
        fb.authorize();
        return deferred.promise;         
        
    } else {
        if(!credentials || !credentials.hasOwnProperty('accessToken')) {
             throw new TypeError();         
        }
    }    
    
    Cloud.SocialIntegrations.externalAccountLogin({
            type : 'facebook',
            token : credentials.accessToken
        }, function(e) {            
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
            if(fb.loggedIn) fb.logout();
            deferred.resolve();            
        } else {
            deferred.reject(e);        
        }
    });    
    
    return deferred.promise;
};
