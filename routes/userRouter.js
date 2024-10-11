const { Router } = require('express');
const { z } = require('zod');
const { userModel , purchaseModel } = require('../db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const {userAuth} = require('../middlewares/userAuth')
const userRouter = Router();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY_USER


//user-SignUp
userRouter.post('/signup', async (req, res) => {
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
            const userPresenTrue = await userModel.findOne({
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
                const singupUser = await userModel.create({
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


// userSignIn
userRouter.post('/signin', async (req, res) => {
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
            const isEmailPresent = await userModel.findOne({
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
                }else{
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


//purchase course - will be better with payment integration
userRouter.post('/purchase-course',userAuth,async(req,res)=>{
    try{
        let userId = req.id;
        let courseId = req.body.courseId;
         // finding with the course id in the current user to avoid for multiple tarnsactions
         let coursePresent = await purchaseModel.find({
             courseId:courseId,
             userId:userId
         })
         if(!coursePresent){
             let purchaseCourse = await purchaseModel.create({
                 userId:userId,
                 courseId:courseId
             })
             if(purchaseCourse){
                 res.status(200).json({
                     msg:"The course has been sucessfully purchased"
                 })
             }
             else{
                 res.status(500).json({
                     msg:"Internal Error"
                 })
             }
         }else{
             res.status(401).json({
                 msg:"The course is already purchased"
             }) 
         }
    }catch(err){
        res.status(404).json({
            err:err.message
        })
    }
   
})

//view All course of the user
userRouter.get('/courses',userAuth,async(req,res)=>{
    try{
        let userId = req.id;
        //find this userId in the purchase model
        let userPurchases = await purchaseModel.find({
            userId:userId
        })
        if(userPurchases  && userPurchases.length > 0){
            let courses = userPurchases.map(purchase => purchase.courseId);
            res.status(200).json({
                msg:"succesfully fetched all the courses of the user",
                courses :courses
            })
        }else{
            res.status(401).json({
                msg:"No courses found with user userId"
            })
        }
    }catch(err){
        res.status(404).json({
            err:err.message
        })
    }
})

module.exports = {
    userRouter
}
