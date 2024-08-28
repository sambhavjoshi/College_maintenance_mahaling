const mongoose = require("mongoose");


const feeSchema = new mongoose.Schema({
  stream: String,
  degree:String,
  semester:Number,
  grade:Number,
  amount:Number,
  hostel:{
    type:Boolean,
    default:false
  }
});

module.exports = mongoose.model("Fee", feeSchema);