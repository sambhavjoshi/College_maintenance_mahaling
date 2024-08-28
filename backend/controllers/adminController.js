const Admin = require("../models/adminModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");

// admin login
exports.loginAdmin = catchAsyncErrors(async (req, res, next) => {
  const { phone, password } = req.body;
  //checing if both given
  if (!phone || !password)
    return next(
      new ErrorHandler(
        "Please enter phone number and password as registered",
        400
      )
    );

  const admin = await Admin.findOne({ phone }).select("+password");
  console.log(admin);
  if (!admin)
    return next(
      new ErrorHandler(
        "Please enter phone number and password as registered",
        401
      )
    );

  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(
      new ErrorHandler(
        "Please enter phone number and password as registered",
        401
      )
    );
  }

  sendToken(admin, 200, res);
});

// admin logout
exports.logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

//update admin password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(req.body.oldPassword);
  console.log(admin.password, req.body.oldPassword,isPasswordMatched);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old Password is Incorrect", 400));
  }
  
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("password does not match", 400));
  }

  admin.password = req.body.newPassword;
  await admin.save();
  sendToken(admin, 200, res);
  res.status(200).json({
    success: true,
    admin,
  });
});

//update profile

exports.updateAdminPhone = catchAsyncErrors(async (req, res, next) => {
  const {password} = req.body;
  const temp = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await temp.comparePassword(password);
  if(!isPasswordMatched)  return next(
    new ErrorHandler(
      "Please enter correct password as registered",
      401
    )
  );
  const newData = {
    phone: req.body.phone,
  };

  const admin = await Admin.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    admin
  });
});

// get admin details

exports.getAdminDetails = catchAsyncErrors(async (req, res, next) => {
  const admin = await Admin.find({ _id: req.user.id });
  res.status(200).json({
    success: true,
    admin,
  });
});
