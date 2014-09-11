require('patches');

var fb = Alloy.Globals.Facebook = require('facebook');
fb.appid = Ti.App.Properties.getString('ti.facebook.appid');

var Auth = require('auth/auth');
Auth.init(Alloy.CFG.auth);