var _ = require('alloy/underscore')._,   
    Alloy = require('alloy');
    
var MODULE_NAME = "TiAuth",
    LOG_PREFIX = MODULE_NAME+':';
    
var Q; try {Q = require('nodejs/q/q');} catch(e) { Q = require(Alloy.CFG.TiAuth.lib.Q);}

var currentUser, providers = [], config, self = this;

function BaseUser() {}

BaseUser.prototype.isAuthenticated = function() {
    return true;
};

BaseUser.prototype.isAnonymous = function() {
    return false;
};

exports.BaseUser = BaseUser;

function AnonymousUser() {
    this.id = null;
}

AnonymousUser.prototype.isAuthenticated = function() {
    return false;
};

AnonymousUser.prototype.isAnonymous = function() {
    return true;
};

currentUser = new AnonymousUser();

exports.init = function(cfg) {
    if(!_.isUndefined(config)) 
    {
        Ti.API.error(LOG_PREFIX, "Already initialized");
        return;
    }
    
    _.each(cfg.providers, function(providerName) {        
        try {
            var provider = require(providerName);
            providers.push(provider);            
        } catch(e) {            
            throw "Couldn't load provider " + providerName + ': ' + ((e.error && e.message) || JSON.stringify(e));                       
        }
    });    
    
    delete cfg.providers;
    
    config = _.extend({
        nextAction: 'index',
        loginAction: 'login',
        permanentLogin: true,
        propPrefix: 'TiAuth.',
        // For more security you can use https://github.com/benbahrenburg/Securely
        properties: Ti.App.Properties        
    }, cfg);
};

exports.authenticate = function authenticate(credentials) {
    if(!credentials && self.credentials) {
        Ti.API.info(MODULE_NAME,'Log in with stored credentials');
        credentials = self.credentials;
    } else {
        Ti.API.info(MODULE_NAME,'Log in initial');
    }
    var creds = _.clone(credentials);
    
    function errorHandler(provider, reason) {                                     
        Ti.API.info(provider.name + ' provider rejected with: ' + 
            (_.isUndefined(reason) ? 'unknown' : 
                (
                (reason.error && reason.message) || (_.isEmpty(reason) && reason.name) || JSON.stringify(reason)
                )
            )
         );              
         
        return Q.reject(reason);            
    }
    
    function successHandler(provider, user){            
        if(!user) {
            throw new Error("User is empty");
        } else {
            if(!(user instanceof BaseUser)) {                        
                user = _.extend(new BaseUser(), user);                        
            }                    
            user.provider = provider;
            self.credentials = creds;
            Ti.API.info('Authenticated with: ' + (provider.name || 'unknown'));
            return user;
        }   
    }
        
    return _.reduce(providers, function(last, provider) {
        var authenticate = _.bind(provider.authenticate, provider, credentials),
            success = _.partial(successHandler, provider),        
            failure = _.partial(errorHandler, provider);
        
        return last.catch(function(reason) {
            try {
                return Q(authenticate()).then(success, failure);
            } catch(e) {                
                return failure(e);
            }            
        });       
    }, Q.reject());
};

/*
 * @method loginRequired
 * Проверяет залогинен ли пользователь и вызывает действие логина если требуется
 * @param {Mixed} nextAction Действие выполняемое после удачного логина. По умолчанию открывает вид `index`.
 * Функция или массив вида ['viewName', argsObject] или 'имя вида'. 
 * @param {Mixed} loginAction Действие выполняемое если пользователь не аутентифицирован. По умолчанию открывает вид  `logon`, если он существует.
 * Функция или массив вида ['viewName', argsObject] или 'имя вида'.
 * @param {Object} context Контекст в котором будут вызваны функции.
 * @return {Boolean} Истина если потребовался вход.
 */
function loginRequired(nextAction, loginAction, context) {
    if(currentUser.isAuthenticated()) return false; 
         
    nextAction = nextAction || config.nextAction;  
    loginAction = loginAction || config.loginAction;
    
    function openView(params) {            
        var args, name;
        if(_.isArray(params) && params.length) {
            name = params[0];
            args = params.length > 1 && params[1];    
        } else if(_.isString(params)) {
            name = params;
        }        
        Alloy.createController(name, args).getView().open(); 
    }        
    
    // build next action callback
    if(_.isFunction(nextAction)) {
        context && (nextAction = _.bind(nextAction, context));            
    } else {
        nextAction = _.partial(openView, nextAction);            
    }        
    
    // build login action callback
    if(_.isFunction(loginAction)) {
        loginAction = _.bind(loginAction, context || null, nextAction);
    } else {
        if(_.isString(loginAction)) {
            loginAction = [loginAction, {next: nextAction}];
        } else if(_.isArray(loginAction)) {
            loginAction[1] = _.extend({next: nextAction}, loginAction[1]);
        } 
        loginAction = _.partial(openView, loginAction);
    }    
    
    Ti.API.info(MODULE_NAME,'Redirect to login action');
    loginAction();
    
    return true;   
}; 

exports.loginRequired = loginRequired;

/**
 * Вернет результат искомой функции или обещание если не определено nextAction
 * @param {Object} fn
 * @param {Object} nextAction
 * @param {Object} context
 */
exports.loginRequiredDecorator = function(fn, nextAction, context) {    
    return _.wrap(fn, function(origFn) {
        var origFnArgs = Array.prototype.slice.call(arguments, 1); 
         
        var deferred, next = nextAction;
        
        // После логина выполняем декорированную функцию если следующее действие не определено
        if(!next) {
            deferred = Q.defer();
            next = function() {            
                deferred.resolve(origFn.apply(null, origFnArgs));
            };
            context = undefined;
        }    
        
        if(!loginRequired(next, null, context)) {            
            return origFn.apply(null, origFnArgs);            
        } else if(deferred) {
            return deferred.promise;
        }        
    });        
};

exports.logout = function logout() {
    function logoutTask() {
        Ti.App.fireEvent(MODULE_NAME+':logged_out');
        self.credentials = null;
        currentUser = new AnonymousUser();
    }
    
    var pLogout = currentUser && currentUser.provider && currentUser.provider.logout;
    if(_.isFunction(pLogout)) {
        return Q(pLogout()).then(logoutTask);
    } else {        
        return Q(true).then(logoutTask);
    }    
};

exports.login = function login(user) {
    currentUser = user;
    Ti.App.fireEvent(MODULE_NAME+':logged_in');
};

Object.defineProperty(exports, 'user', {
    get: function() { return currentUser; }
});

Object.defineProperty(this, 'credentials', {
   get: function() {
       return config.permanentLogin && config.properties.getObject(config.propPrefix + 'credentials');
   },
   set: function(value) {
       config.permanentLogin && config.properties.setObject(config.propPrefix + 'credentials', value);
   }
});
