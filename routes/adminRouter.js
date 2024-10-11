const { Router } = require('express');
const { z } = require('zod');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const adminRouter = Router();
const { adminModel, courseModel } = require('../db')
const { adminAuth } = require('../middlewares/adminAuth')

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY_ADMIN

adminRouter.post('/signup', async (req, res) => {
    try {
        // input validation - schema
        const signUpInpValidation = z.object({
            email: z.string().min(6).max(30).email(),
            password: z.string().min(3).max(20),
            FirstName: z.string(),
            LastName: z.string()
        })
        //parsing
        const isParsed = signUpInpValidation.safeParse(req.body)
        //if true
        if (isParsed.success) {
            const email = req.body.email;
            const password = req.body.password;
            const FirstName = req.body.FirstName;
            const LastName = req.body.LastName;
            // Safe Check - userAlreadyExists
            const userPresenTrue = await adminModel.findOne({
                email: email
            })
            if (userPresenTrue) {
                res.status(401).json({
                    msg: "User with this email is Already present"
                })
                return
            }
            if (!userPresenTrue) {
                let hashedPassword = await bcrypt.hash(password, 5)
                const singupUser = await adminModel.create({
                    email: email,
                    password: hashedPassword,
                    FirstName: FirstName,
                    LastName: LastName,
                })
                // if db call is true
                if (singupUser) {
                    res.status(200).json({
                        msg: "user sucessfully has been signed up"
                    })
                    return
                }
                else {
                    res.status(500).json({
                        msg: "DB error"
                    })
                    return
                }
            }
        }
        if (isParsed.error) {
            res.status(400).json({
                msg: "input validation",
                Error: isParsed.error
            })
        }
    } catch (err) {
        res.status(404).json({
            error: err.message
        })
    }
})


adminRouter.post('/signin', async (req, res) => {
    try {
        //input validation
        const signInValidation = z.object({
            email: z.string().min(6).max(30).email(),
            password: z.string().min(3).max(20)
        })
        //parsing with body object
        const parsedData = signInValidation.safeParse(req.body)
        // if parsed data is true
        if (parsedData.success) {
            let email = req.body.email;
            let password = req.body.password;

            // checking email in db 
            const isEmailPresent = await adminModel.findOne({
                email: email
            })
            //if true
            if (isEmailPresent) {
                //compare the passwords
                let passwordTrue = bcrypt.compare(password, isEmailPresent.password)
                //if true - return the JWT to the user
                if (passwordTrue) {
                    let token = jwt.sign({
                        id: isEmailPresent._id,
                    }, JWT_SECRET_KEY)
                    res.status(200).json({
                        msg: "user has been sucessfully logged In",
                        token: token
                    })
                } else {
                    res.status(401).json({
                        msg: "Sorry wrong Password",
                    })
                }
            } else {
                res.status(401).json({
                    msg: "user is not present with the following Email , please SIGNUP",
                })
            }

        }
        if (parsedData.error) {
            res.status(400).json({
                msg: "input validation",
                Error: parsedData.error
            })
        }
    } catch (err) {
        res.status(404).json({
            err: err.message
        })
    }
})


//create Course
adminRouter.post('/create-course', adminAuth, async (req, res) => {
    try {
        let CreatorId = req.id;
        let creatorPresent = await adminModel.find({
            _id: CreatorId
        })
        if (creatorPresent) {
            let title = req.body.title;
            let thumbnailUrl = req.body.thumbnailUrl;
            let price = req.body.price;
            let createNewCourse = await courseModel.create({
                CreatorId: CreatorId,
                title: title,
                thumbnailUrl: thumbnailUrl,
                price: price
            })
            if (createNewCourse) {
                res.status(200).json({
                    msg: "sucessfully created the course",
                    courseId: createNewCourse._id
                })
            } else {
                res.status(500).json({
                    msg: "Internal error"
                })
            }
        }
        else {
            res.status(401).json({
                msg: "admin not valid",
            })
        }

    } catch (err) {
        res.status(404).json({
            err: err.message
        })
    }
})

//update course 
adminRouter.post('/update-course', adminAuth, async (req, res) => {
    try {
        let CreatorId = req.id;
        let creatorPresent = await adminModel.find({
            CreatorId: CreatorId
        })
        if (creatorPresent) {
            let title = req.body.title;
            let courseId = req.body.courseId
            let thumbnailUrl = req.body.thumbnailUrl;
            let price = req.body.price;
            let isCourseIdPresent = await courseModel.find({courseid:courseId})
            if (isCourseIdPresent) {
                let updateCourse = await courseModel.updateOne({
                    title: title,
                    thumbnailUrl: thumbnailUrl,
                    price: price
                })
                if (updateCourse) {
                    res.status(200).json({
                        msg: "The course has been sucessfully updated"
                    })
                }
            } else {
                res.status(400).json({
                    msg: "the course with courseId is not present to update"
                })
            }
        }
        else {
            res.status(401).json({
                msg: "admin not valid",
            })
        }

    } catch (err) {
        res.status(404).json({
            err: err.message
        })
    }
})


//Delete-Course
adminRouter.delete('/Delete-course', adminAuth, async (req, res) => {
    try {
        let CreatorId = req.id;
        let courseId = req.body.courseId;
        //check the user is the admin
        let isCreatorIsAdmin = await adminModel.findById(CreatorId)
        if (isCreatorIsAdmin) {
            //finding is the course present to delete 
            let isCoursePresent = await courseModel.find({
                _id:courseId
            })
            if (isCoursePresent && isCoursePresent.length > 0) {
                let deleteCourse = await courseModel.deleteOne({
                    _id: courseId
                })
                if (deleteCourse) {
                    res.status(200).json({
                        "msg": "The course has been sucessfully deleted"
                    })
                }
                else {
                    res.status(500).json({
                        "msg": "Sorry something is up with server"
                    })
                }
            }else{
                res.status(404).json({
                    msg:"Sorry the course with the provided courseID is not present"
                })
            }
        }else{
            res.status(401).json({
                msg:"The user is not admin to delete the course"
            })
        }
} catch (err) {
    res.status(404).json({
        err: err.message
    })
}
})


//admin able to see all the courses he created
adminRouter.get('/courses/all',adminAuth,async(req,res)=>{
        try{
            let CreatorId = req.id;
            //find does the uses exist in Admin table
            let isCreator = await adminModel.findById(CreatorId)
            if(isCreator){
                //find all the courses releated to the creator id in course model
                let allcourses = await courseModel.find({CreatorId: CreatorId})
                let array = []
                for(let i in allcourses){
                    array.push(allcourses[i])
                }
                if(allcourses){
                    res.status(200).json({
                       allcourses:array
                    })
                }
                else{
                    res.status(200).json({
                        msg:"no course to the following creatorID"
                    })
                }
            }
            else{
                res.status(401).json({
                    msg:"arent you admin?"
                })
            }
        }catch(err){
         res.status(404).json({
            msg:err.message
         })
        }
})

module.exports={
    adminRouter
}