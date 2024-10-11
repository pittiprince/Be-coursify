const jwt = require('jsonwebtoken')
const JWT_SECRET_KEY_USER = process.env.JWT_SECRET_KEY_USER
function userAuth(req, res, next) {
    try {
        let token = req.headers.token
        if (token) {
            let check = jwt.verify(token, JWT_SECRET_KEY_USER)
            console.log(check)
            req.id=check.id;
            next()
            res.status(401).json({
                msg: "unAuthorized"
            })
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
    userAuth
}