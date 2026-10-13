const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { userRouter } = require('./routes/userRouter');
const { adminRouter } = require('./routes/adminRouter');
const { courseRouter } = require('./routes/courseRouter');

const app = express();

// Render (and most hosts) put a proxy in front of the app; needed so rate limiting sees the real client IP
app.set('trust proxy', 1);

app.use(helmet());

// CORS_ORIGIN can be a comma separated list, e.g. https://my-frontend.vercel.app
// When it is not set every origin is allowed (fine for a public demo API that uses bearer tokens).
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : true;
app.use(cors({ origin: allowedOrigins }));

app.use(express.json({ limit: '100kb' }));

// general limit for the whole API, stricter limit on signup/signin to slow down password guessing
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false
});
app.use(['/api/user/signup', '/api/user/signin', '/api/admin/signup', '/api/admin/signin'], authLimiter);

// used by the hosting platform's health check
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/course', courseRouter);

// unknown route
app.use((req, res) => res.status(404).json({ msg: 'Route not found' }));

// central error handler: invalid JSON bodies, DB errors, anything thrown in a route
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ msg: 'Request body is not valid JSON' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ msg: 'Request body too large' });
    }
    console.error(err);
    return res.status(500).json({ msg: 'Internal server error' });
});

module.exports = app;
