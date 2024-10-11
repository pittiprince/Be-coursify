const { Router } = require('express');
const courseRouter = Router();
const { courseModel } = require('../db')

courseRouter.get('/courses/all',async(req,res)=>{
    let allCourses = await courseModel.find()
    if(allCourses.length > 0){
        res.status(200).json({
            allCourses:allCourses
        })
    }
    else{
        res.status(200).json({
            msg:"No courses"
        })
    }
})

module.exports={
    courseRouter
}