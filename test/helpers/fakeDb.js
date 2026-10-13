// Tiny in-memory stand-in for the mongoose models in db.js, so the API logic can be tested
// without a running MongoDB. It implements only the methods the routes use.
const crypto = require('node:crypto');

const newId = () => crypto.randomBytes(12).toString('hex');

function matches(row, filter) {
    return Object.entries(filter).every(([key, expected]) => {
        if (expected && typeof expected === 'object' && Array.isArray(expected.$in)) {
            return expected.$in.map(String).includes(String(row[key]));
        }
        return String(row[key]) === String(expected);
    });
}

function makeModel(uniqueKeySets = []) {
    let rows = [];
    return {
        reset() { rows = []; },
        async findOne(filter) { return rows.find((r) => matches(r, filter)) || null; },
        async findById(id) { return rows.find((r) => String(r._id) === String(id)) || null; },
        async find(filter = {}) { return rows.filter((r) => matches(r, filter)); },
        async create(doc) {
            for (const keys of uniqueKeySets) {
                if (rows.some((r) => keys.every((k) => String(r[k]) === String(doc[k])))) {
                    const err = new Error('E11000 duplicate key');
                    err.code = 11000;
                    throw err;
                }
            }
            const row = { _id: newId(), ...doc };
            rows.push(row);
            return row;
        },
        async findOneAndUpdate(filter, update) {
            const row = rows.find((r) => matches(r, filter));
            if (!row) return null;
            Object.assign(row, update.$set);
            return row;
        },
        async findOneAndDelete(filter) {
            const index = rows.findIndex((r) => matches(r, filter));
            return index < 0 ? null : rows.splice(index, 1)[0];
        },
        async deleteMany(filter) { rows = rows.filter((r) => !matches(r, filter)); }
    };
}

module.exports = {
    userModel: makeModel([['email']]),
    adminModel: makeModel([['email']]),
    courseModel: makeModel(),
    purchaseModel: makeModel([['userId', 'courseId']])
};
