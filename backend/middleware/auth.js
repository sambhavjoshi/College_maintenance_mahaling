const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

exports.isAuthUser = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return next(new ErrorHandler("Please Login to access", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await Admin.findById(decodedData.id); // yahan set horhi hai req.user
  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler("you are not admin", 403));
    }
    next();
  };
};
