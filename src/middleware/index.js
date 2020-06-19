"use strict";

// if logged, then redirect
function loggedOut(req, res, next) {
    if (req.session && req.session.userId) {
        return res.redirect('/profile');
    }
    return next();
}

//Need to login to view page
function requiresLogin(req, res, next) {
    if (req.session && res.session.userId) {
        return next();
    } else {
        let err = new Error('Need to login to view');
        err.status = 401;
        return next(err);
    }
}

function callbackModel(ctx, status, message, data) {
    ctx.response.status = status;
    ctx.body = {
        code: status,
        message: message,
        data: data,
    };
}

module.exports.loggedOut = loggedOut;
module.exports.requiresLogin = requiresLogin;