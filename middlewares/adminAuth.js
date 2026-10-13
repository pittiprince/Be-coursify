const { makeAuth } = require('./makeAuth');

const adminAuth = makeAuth('JWT_SECRET_KEY_ADMIN');

module.exports = {
    adminAuth
};
