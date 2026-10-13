// Express 4 does not catch rejected promises from async handlers.
// Wrapping handlers with this forwards any error to the central error handler
// instead of leaving the request hanging or crashing the process.
module.exports = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
