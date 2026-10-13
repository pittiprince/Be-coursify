const { z } = require('zod');
const { userModel, purchaseModel, courseModel } = require('../db');
const { userAuth } = require('../middlewares/userAuth');
const { buildAuthRouter } = require('./authRoutes');
const asyncHandler = require('../utils/asyncHandler');

// /signup and /signin
const userRouter = buildAuthRouter({
    model: userModel,
    secretEnv: 'JWT_SECRET_KEY_USER',
    label: 'User'
});

const purchaseSchema = z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'courseId must be a valid id')
});

// purchase course - will be better with payment integration
userRouter.post('/purchase-course', userAuth, asyncHandler(async (req, res) => {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ msg: 'Invalid input', errors: parsed.error.flatten().fieldErrors });
    }
    const { courseId } = parsed.data;

    // the course has to exist before it can be bought
    if (!(await courseModel.findById(courseId))) {
        return res.status(404).json({ msg: 'Course not found' });
    }

    // FIX: the old code used find() (returns an array, always truthy), so a purchase was never created.
    // Now we rely on the unique (userId, courseId) index, which is also safe against double-clicks.
    if (await purchaseModel.findOne({ userId: req.id, courseId })) {
        return res.status(409).json({ msg: 'The course is already purchased' });
    }
    try {
        await purchaseModel.create({ userId: req.id, courseId });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ msg: 'The course is already purchased' });
        }
        throw err;
    }
    return res.status(201).json({ msg: 'The course has been successfully purchased' });
}));

// view all courses the user has purchased
userRouter.get('/courses', userAuth, asyncHandler(async (req, res) => {
    const purchases = await purchaseModel.find({ userId: req.id });
    const courseIds = purchases.map((purchase) => purchase.courseId);
    const courses = courseIds.length ? await courseModel.find({ _id: { $in: courseIds } }) : [];
    // an empty list is a normal result, not an auth error
    return res.status(200).json({ msg: 'Fetched purchased courses', courses });
}));

module.exports = {
    userRouter
};
