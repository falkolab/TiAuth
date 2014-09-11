var Auth = require('auth/auth');

$.logout.visible = Auth.user.isAuthenticated();
$.login.visible = !$.logout.visible;

function doLogin(e) {
    if(!Auth.loginRequired()) {        
        $.logout.show();
        $.login.hide();
        updateLabel();
    }
}

function doLogout() {
    Auth.logout();
    $.logout.hide();
    $.login.show();
    updateLabel();
}

function updateLabel() {
    $.label.text = String.format('Hello %s!', Auth.user.first_name || 'anonymous');    
}

updateLabel();
$.index.open();