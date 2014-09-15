var Auth = require('auth/auth');

$.logout.visible = Auth.user.isAuthenticated();
$.login.visible = !$.logout.visible;

function doLogin() {
    if(!Auth.loginRequired()) {        
        $.logout.show();
        $.login.hide();
        updateLabel();
    }
}

function doLogout() {
    Auth.logout().then(function(){
        $.logout.hide();
        $.login.show();
        updateLabel();    
    });
    
}

function updateLabel() {
    $.label.text = String.format('Hello %s!', Auth.user.first_name || 'anonymous');    
}

function opened() {
    $.logout.visible = Auth.user.isAuthenticated();
    $.login.visible = !$.logout.visible;    
}

updateLabel();
$.index.open();