const jwt = require('jsonwebtoken');

// Accepts `Authorization: Bearer <token>` (preferred) or the legacy `token` header.
function getToken(req) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
    return req.headers.token;
}

// Builds an auth middleware that verifies a JWT with the secret stored in
// process.env[secretEnvName]. It answers the request itself ONLY when the
// token is bad, and otherwise calls next() exactly once and returns.
function makeAuth(secretEnvName) {
    return function auth(req, res, next) {
        const token = getToken(req);
        if (!token) {
            return res.status(401).json({ msg: 'Authentication token is missing' });
        }
        let payload;
        try {
            payload = jwt.verify(token, process.env[secretEnvName]);
        } catch (err) {
            return res.status(401).json({ msg: 'Invalid or expired token' });
        }
        req.id = payload.id;
        return next();
    };
}

module.exports = { makeAuth };
