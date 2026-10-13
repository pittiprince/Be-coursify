const { makeAuth } = require('./makeAuth');

// FIX: the old version called next() and then also sent a 401, so every
// protected route answered "unAuthorized". Now it only responds on failure.
const userAuth = makeAuth('JWT_SECRET_KEY_USER');

module.exports = {
    userAuth
};
