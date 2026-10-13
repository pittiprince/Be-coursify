require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const REQUIRED_ENV = ['MongooseURL', 'JWT_SECRET_KEY_USER', 'JWT_SECRET_KEY_ADMIN'];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

// Hosting platforms (Render, Railway, ...) tell the app which port to use through PORT
const PORT = process.env.PORT || 3000;

async function main() {
    try {
        await mongoose.connect(process.env.MongooseURL);
        console.log('Connected to MongoDB');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Could not start the server:', err.message);
        process.exit(1);
    }
}

main();
