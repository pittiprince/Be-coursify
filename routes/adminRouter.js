const { z } = require('zod');
const { adminModel, courseModel, purchaseModel } = require('../db');
const { adminAuth } = require('../middlewares/adminAuth');
const { buildAuthRouter } = require('./authRoutes');
const asyncHandler = require('../utils/asyncHandler');

// /signup and /signin
const adminRouter = buildAuthRouter({
    model: adminModel,
    secretEnv: 'JWT_SECRET_KEY_ADMIN',
    label: 'Admin'
});

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'must be a valid id');

const createCourseSchema = z.object({
    title: z.string().trim().min(1).max(120),
    thumbnailUrl: z.string().trim().url().max(500).optional(),
    price: z.number().min(0)
});

const updateCourseSchema = z.object({
    courseId: objectId,
    title: z.string().trim().min(1).max(120).optional(),
    thumbnailUrl: z.string().trim().url().max(500).optional(),
    price: z.number().min(0).optional()
});

const deleteCourseSchema = z.object({ courseId: objectId });

// create Course
adminRouter.post('/create-course', adminAuth, asyncHandler(async (req, res) => {
    const parsed = createCourseSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
    }
    const course = await courseModel.create({ CreatorId: req.id, ...parsed.data });
    return res.status(201).json({ msg: 'Successfully created the course', courseId: course._id });
}));

// update course
// FIX: the old code passed the new values as the *filter* of updateOne, with no $set and no
// ownership check. Now only the creator's own course is matched and only the sent fields change.
adminRouter.post('/update-course', adminAuth, asyncHandler(async (req, res) => {
    const parsed = updateCourseSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
    }
    const { courseId, ...changes } = parsed.data;
    if (Object.keys(changes).length === 0) {
        return res.status(400).json({ msg: 'Send at least one of title, thumbnailUrl, price' });
    }
    const updated = await courseModel.findOneAndUpdate(
        { _id: courseId, CreatorId: req.id },
        { $set: changes },
        { new: true }
    );
    if (!updated) {
        return res.status(404).json({ msg: 'Course not found, or you are not its creator' });
    }
    return res.status(200).json({ msg: 'The course has been successfully updated', course: updated });
}));

// Delete-Course (only the creator can delete their own course)
adminRouter.delete('/Delete-course', adminAuth, asyncHandler(async (req, res) => {
    const parsed = deleteCourseSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
    }
    const deleted = await courseModel.findOneAndDelete({ _id: parsed.data.courseId, CreatorId: req.id });
    if (!deleted) {
        return res.status(404).json({ msg: 'Course not found, or you are not its creator' });
    }
    // do not leave purchases pointing at a course that no longer exists
    await purchaseModel.deleteMany({ courseId: parsed.data.courseId });
    return res.status(200).json({ msg: 'The course has been successfully deleted' });
}));

// admin can see all the courses he created
adminRouter.get('/courses/all', adminAuth, asyncHandler(async (req, res) => {
    const allcourses = await courseModel.find({ CreatorId: req.id });
    return res.status(200).json({ allcourses });
}));

module.exports = {
    adminRouter
};
