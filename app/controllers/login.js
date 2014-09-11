var Auth = require('auth/auth');
var args = arguments[0] || {};

var loginFailure = function loginFailure(reason) {   
    
    Ti.UI.createAlertDialog({
            message : 'Login or password is incorrect',
            ok : 'Ok',
            title : 'Unable to login'
        }).show();
};

// Cloud login
function reset(e) {
    e.source.backgroundColor = "#FFFFFF";   
};

$.loginField.addEventListener('change', reset);
$.passwordField.addEventListener('change', reset);

function doCloudLogin() {    
    if(OS_ANDROID) {
        Ti.UI.Android.hideSoftKeyboard();
    }
    
    if(!$.loginField.value || !$.passwordField.value) {
        $.loginField.backgroundColor = "#FFD1B2";
        $.passwordField.backgroundColor = "#FFD1B2";
        return;
    } else {
        $.loginField.backgroundColor = "#FFFFFF";
        $.passwordField.backgroundColor = "#FFFFFF";
    }
   
    $.submitButton.enabled = false;        
    Auth.authenticate({
        login: $.loginField.value,
        password: $.passwordField.value             
    }).
    then(function cloudLoginSuccess(user){        
        Auth.login(user);
        args.next();        
    }, loginFailure).
    fin(function cloudLoginFin() {     
        $.submitButton.enabled = true;
    });    
}

// facebook login

var fb = Alloy.Globals.Facebook;
$.fbButton.style = fb.BUTTON_STYLE_WIDE;
fb.permissions = Alloy.CFG.auth_provider_facebook_startPermissions || [];
fb.forceDialogAuth = false;

var facebookLoginHandler = function(e) {    
    if (e.success) {        
        Ti.API.info('Вошли в facebook успешно');     
        
        Auth.authenticate({
            accessToken: fb.accessToken            
        }).then(function facebookLoginSuccess(){
            
        }, loginFailure).fin(function facebookLoginFin() {
                    
        });
    } else if (e.error) {
        loginFailure(e.error);
    } else if (e.cancelled) {
        Ti.API.info("Пользователь отказался входить через Facebook");
    }
};

fb.addEventListener('login', facebookLoginHandler);

//

$.login.addEventListener('open', function() {    
    if (OS_ANDROID) {
        $.login.activity.actionBar.show();
    }
});

$.login.addEventListener("close", function(){
    fb.removeEventListener('login', facebookLoginHandler);
    $.destroy();
});