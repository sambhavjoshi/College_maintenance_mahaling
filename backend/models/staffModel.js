const mongoose = require("mongoose");


const staffSchema = new mongoose.Schema({
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
  salary:Number,
  lastMonthPaid:String,
  leavesAllowed:{
    type:Number,
    default:18,
  },
  leavesUsed:{
    type:Number,
    default:0,
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
  qualification:String,
  dateOfJoining:String,
  experience:Number,
  designation:String,
  subject:String,
  deductionLeaves:{
    type:Number,
    default:0,
  },
  salaryDeduction:{
    type:Number,
    default:0,
  },
  photo:String,
  aadhar:String,
  pgCertificate:String,
  appointment:String
});

module.exports = mongoose.model("Staff", staffSchema);
