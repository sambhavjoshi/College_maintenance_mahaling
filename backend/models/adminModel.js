const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Name"],
  },
  phone:{
        type:String,
        required:[true,"Please enter phone number"],
        unique: true
  },
  password: {
    type: String,
    required: [true, "please enter password"],
    minLength: [7, "password must have atleast 7 charcaters"],
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// JWT TOKEN// allows login
adminSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// compare password

adminSchema.methods.comparePassword = async function (enteredPassword) {
  return (enteredPassword === this.password);
};


module.exports = mongoose.model("Admin", adminSchema);
