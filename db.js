// Schemas for User, Admin, Course, Purchase
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const emailField = {
    type: String,
    required: true,
    unique: true, // enforced by a MongoDB unique index (prevents duplicate-signup race conditions)
    lowercase: true,
    trim: true
};

// User - schema
const UserSchema = new Schema({
    email: emailField,
    password: { type: String, required: true },
    FirstName: { type: String, required: true, trim: true },
    LastName: { type: String, required: true, trim: true }
}, { timestamps: true });

// Admin (course creator) schema
const AdminSchema = new Schema({
    email: emailField,
    password: { type: String, required: true },
    FirstName: { type: String, required: true, trim: true },
    LastName: { type: String, required: true, trim: true }
}, { timestamps: true });

// Course schema
const CourseSchema = new Schema({
    CreatorId: { type: ObjectId, ref: 'admin', required: true, index: true },
    title: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 }
}, { timestamps: true });

// Purchase schema
const PurchaseSchema = new Schema({
    userId: { type: ObjectId, ref: 'user', required: true },
    courseId: { type: ObjectId, ref: 'courses', required: true }
}, { timestamps: true });

// A user can buy a given course only once (also guards against double-click races)
PurchaseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Data - Models
const userModel = mongoose.model('user', UserSchema);
const adminModel = mongoose.model('admin', AdminSchema);
const courseModel = mongoose.model('courses', CourseSchema);
const purchaseModel = mongoose.model('purchase', PurchaseSchema);

module.exports = {
    userModel,
    adminModel,
    courseModel,
    purchaseModel
};
