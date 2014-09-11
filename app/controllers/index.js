function doClick(e) {
    alert($.label.text);
}
var Auth = require('auth/auth');
if(!Auth.loginRequired()) {
    Ti.API.info(JSON.stringify(Auth.user));    
    $.label.text = String.format('Hello %s!', Auth.user.first_name);
}
$.index.open();