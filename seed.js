// Idempotent demo data. Runs at start-up only when SEED_DEMO=true.
const bcrypt = require('bcrypt');
const { userModel, adminModel, courseModel, purchaseModel } = require('./db');

const DEMO_PASSWORD = 'Demo@12345';
const thumb = (title) => `https://picsum.photos/seed/coursify-${encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}/640/360`;
const COURSES = [
    ['Full-Stack Web Development with Node & React', 2499],
    ['Data Structures & Algorithms in Python', 1999],
    ['System Design Fundamentals', 2999],
    ['MongoDB Mastery: Schemas, Indexes, Aggregations', 1499],
    ['Docker & Kubernetes for Developers', 2299],
    ['TypeScript from Zero to Production', 1299],
    ['REST API Security: JWT, RBAC, OWASP Top 10', 1799],
    ['Git & GitHub Workflows for Teams', 499]
];

async function seedDemoData() {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    let admin = await adminModel.findOne({ email: 'demo-admin@coursify.dev' });
    if (!admin) admin = await adminModel.create({ email: 'demo-admin@coursify.dev', password: hash, FirstName: 'Demo', LastName: 'Instructor' });
    let user = await userModel.findOne({ email: 'demo-user@coursify.dev' });
    if (!user) user = await userModel.create({ email: 'demo-user@coursify.dev', password: hash, FirstName: 'Demo', LastName: 'Learner' });

    if ((await courseModel.countDocuments({ CreatorId: admin._id })) === 0) {
        await courseModel.insertMany(COURSES.map(([title, price]) => ({ CreatorId: admin._id, title, price, thumbnailUrl: thumb(title) })));
    }
    else for (const [title] of COURSES) await courseModel.updateOne({ CreatorId: admin._id, title, thumbnailUrl: { $exists: false } }, { $set: { thumbnailUrl: thumb(title) } });
    const first = await courseModel.findOne({ CreatorId: admin._id });
    if (first && !(await purchaseModel.findOne({ userId: user._id, courseId: first._id }))) {
        await purchaseModel.create({ userId: user._id, courseId: first._id });
    }
    console.log('Demo data ready (SEED_DEMO=true)');
}

module.exports = { seedDemoData, DEMO_PASSWORD };
