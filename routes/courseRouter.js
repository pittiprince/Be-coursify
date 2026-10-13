const { Router } = require('express');
const courseRouter = Router();
const { courseModel } = require('../db');
const asyncHandler = require('../utils/asyncHandler');

// public catalogue
courseRouter.get('/courses/all', asyncHandler(async (req, res) => {
    const allCourses = await courseModel.find();
    return res.status(200).json({ allCourses });
}));

module.exports = {
    courseRouter
};
