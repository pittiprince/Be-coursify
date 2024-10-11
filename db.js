//Define the schema for User, Admin, Course, Purchase
const mongoose = require('mongoose');
const Schema = mongoose.Schema;;
const ObjectId = Schema.Types.ObjectId;


//User - schema
const UserSchema = new Schema({
    email:String,
    password:String,
    FirstName:String,
    LastName:String,
    userId:ObjectId
})


//Admin Schema
const AdminSchema = new Schema({
    email:String,
    password:String,
    FirstName:String,
    LastName:String,
    CreatorId:ObjectId
})

//course Schema
const CourseSchema = new Schema({
    courseid:ObjectId,
    CreatorId:String,
    title:String,
    thumbnailUrl:String,
    price:Number,

})

//purchase - Schema 
const PurchaseSchema = new Schema({
    id:ObjectId,
    userId:ObjectId,
    courseId:ObjectId
})



// Data - Models
const userModel = mongoose.model('user',UserSchema);
const adminModel = mongoose.model('admin',AdminSchema);
const courseModel = mongoose.model('courses',CourseSchema);
const purchaseModel = mongoose.model('purchase',PurchaseSchema)

module.exports = {
    userModel,
    adminModel,
    courseModel,
    purchaseModel
}