const { Router } = require('express');
const { z } = require('zod');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so the response time does not reveal
// whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const emailSchema = z.string().trim().toLowerCase().email().max(254);

const signUpSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters').max(72), // bcrypt ignores bytes past 72
    FirstName: z.string().trim().min(1).max(50),
    LastName: z.string().trim().min(1).max(50)
});

const signInSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(72)
});

// Builds the signup + signin routes shared by users and admins.
//   model     - mongoose model to read/write accounts
//   secretEnv - name of the env var holding the JWT secret for this role
//   label     - "User" | "Admin", used in messages
function buildAuthRouter({ model, secretEnv, label }) {
    const router = Router();

    router.post('/signup', asyncHandler(async (req, res) => {
        const parsed = signUpSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ msg: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
        }
        const { email, password, FirstName, LastName } = parsed.data;

        if (await model.findOne({ email })) {
            return res.status(409).json({ msg: `${label} with this email already exists` });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        try {
            await model.create({ email, password: hashedPassword, FirstName, LastName });
        } catch (err) {
            // two simultaneous signups: the unique index rejects the second one
            if (err && err.code === 11000) {
                return res.status(409).json({ msg: `${label} with this email already exists` });
            }
            throw err;
        }
        return res.status(201).json({ msg: `${label} signed up successfully` });
    }));

    router.post('/signin', asyncHandler(async (req, res) => {
        const parsed = signInSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ msg: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
        }
        const { email, password } = parsed.data;

        const account = await model.findOne({ email });
        // FIX: bcrypt.compare returns a Promise. It must be awaited, otherwise the
        // Promise object is always truthy and ANY password was accepted.
        const passwordMatches = await bcrypt.compare(password, account ? account.password : DUMMY_HASH);

        if (!account || !passwordMatches) {
            // one generic message so attackers cannot tell which emails are registered
            return res.status(401).json({ msg: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: account._id }, process.env[secretEnv], {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d'
        });
        return res.status(200).json({ msg: `${label} signed in successfully`, token });
    }));

    return router;
}

module.exports = { buildAuthRouter };
