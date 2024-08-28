const mongoose = require("mongoose");


const schoolStudentSchema = new mongoose.Schema({
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
    },
    phone:{
        type:String,
    },
  },
  stream:{
    type:String,
    required: [true,"Please enter stream of Student"],
  },
  grade:{
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
      bookName: String,
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
  hostel:{
    type:Boolean,
    default:false,
  }
});

module.exports = mongoose.model("SchoolStudent", schoolStudentSchema);