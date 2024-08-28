const mongoose = require("mongoose");


const collegeStudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Name"],
    maxLength: [30, "Too lengthy for a name"],
    minLength: [3, "Please Enter a longer Name"],
  },
  phone: {
    type: String,
    required: [true, "Please Enter Phone Number"],
  },
  sonOf: {
    name:{
        type: String,
        required: [true,"Please enter parent's name"],
    },
    phone:{
        type:String,
        required: [true,"Please enter parent's phone number"]
    },
  },
  stream:{
    type:String,
    required: [true,"Please enter stream of Student"],
  },
  degree:{
    type:String,
    required: [true,"Please enter degree"]
  },
  semester:{
    type:Number,
    required: [true,"Please enter class of Student"], 
  },
  discounted: Number,
  rollNo:{
    type:String,
    required: [true,"Please enter roll number"],
  },
  feeLeft:Number,
  feePaid:{
    type:Number,
    default:0
  },
  books:[
    {
      book: {
        type: Number,
      },
      Date: {
        type: Date,
        default: Date.now(),
      },
      issuedBy: {
        type: String,
      },
      bookName:String,
      fine:Number,
    },
  ],
  feePayments:[
           {
               amount:{
                type:Number,
               },
               paidBy:{
                type:String,
               },
               acceptedBy:{
                type:String,
               },
               paidOn:{
                type:Date,
                default: Date.now(),
               },
               receiptNo:{
                type:String,
               }
           }
  ],
  address:String,
  hostel:Boolean,
});

module.exports = mongoose.model("CollegeStudent", collegeStudentSchema);