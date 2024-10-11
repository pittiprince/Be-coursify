const jwt = require('jsonwebtoken')
const JWT_SECRET_KEY_USER = process.env.JWT_SECRET_KEY_ADMIN
function adminAuth(req, res, next) {
    try {
        let token = req.headers.token
        if (token) {
            let check = jwt.verify(token, JWT_SECRET_KEY_USER)
            console.log(check)
            req.id=check.id;
            next()
        }
        else {
            res.status(401).json({
                msg: "token is not valid"
            })
        }
    } catch (err) {
        res.status(401).json({
            msg: err.message
        })
    }

}

module.exports = {
    adminAuth
}