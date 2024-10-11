// Initialize a new Node.js project ✅
// Add Express, jsonwebtoken, mongoose to it as a dependency ✅
// Create index.js ✅
// Add route skeleton for user login, signup, purchase a course, sees all courses, sees the purchased courses course
// Add routes for admin login, admin signup, create a course, delete a course, add course content.
// Define the schema for User, Admin, Course, Purchase ✅
// Add a database (mongodb), use dotenv to store the database connection string ✅
// Add middlewares for user and admin auth ✅
// Complete the routes for user login, signup, purchase a course, see course (Extra points - Use express routing to better structure your routes) ✅


// time took to complete is 3hr +- 10mins

require('dotenv').config()
const express = require('express')
const app = express()
const PORT = process.env.PORT
const moongose = require('mongoose')
const {userRouter}= require('./routes/userRouter')
const {adminRouter}= require('./routes/adminRouter')
const {courseRouter} = require('./routes/courseRouter')

app.use(express.json())

app.use('/api/user',userRouter);
app.use('/api/admin',adminRouter);
app.use('/api/course',courseRouter);

async function main(){
    try{
        let connection = await moongose.connect(process.env.MongooseURL)
       if(connection){
        app.listen(PORT,()=>{
            console.log("connection successfulyy established with DB and server hs been started")
        })
       }
    }catch(err){
        console.log(err)
    }
}

main()