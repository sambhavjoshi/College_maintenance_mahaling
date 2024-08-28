const Fee = require("../models/feeModel");
const Admin = require("../models/adminModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");

exports.createFee = catchAsyncErrors(async (req, res, next) => {
    req.body.degree = req.body.degree ? req.body.degree.toUpperCase() : "";
    req.body.stream = req.body.stream ? req.body.stream.toUpperCase() : "";
    let fee = await Fee.findOne(req.body);
    if(!fee || fee==null) fee = await Fee.create(req.body);
    res.status(201).json({
      success: true,
      fee,
    });
});

exports.getAllFees = catchAsyncErrors(async (req, res, next) => {
    const apiFeature = new ApiFeatures(Fee.find(), req.query).search();
    const fees = await apiFeature.query;
    const feesCount = fees.length;
    const feesListAfterApplyingPagination = await (new ApiFeatures(Fee.find(), req.query).search().sort().pagination()).query;
    res.status(200).json({
      success: true,
      fees:feesListAfterApplyingPagination,
      feesCount
    });
  });
  
  exports.getFee = catchAsyncErrors(async (req, res, next) => {
    const fee = await Fee.findById(req.params.id);
    if (fee === null) return next(new ErrorHandler("not found", 404));
  
    res.status(200).json({
      success: true,
      fee,
    });
  });

  exports.updateFee = catchAsyncErrors(async (req, res, next) => {
    const { password } = req.body;
    const admin = await Admin.findById(req.user.id).select("+password");
    const isPasswordMatched = await admin.comparePassword(password);
  
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Admin password is Incorrect", 400));
    }
    
    if(req.body.spPassword !== "SAMPAN2011") {
      return next(new ErrorHandler("Special password is Incorrect", 400));
    }

    const fee = await Fee.findById(req.params.id);
    if (fee === null) {
      return next(new ErrorHandler("not found", 404));
    }
    fee.amount = req.body.amount;
    await fee.save({ validateBeforeSave: false });
  
    res.status(200).json({
      success: true,
      fee,
    });
  });
  

  exports.deleteFee = catchAsyncErrors(async (req, res, next) => {
    const { password } = req.body;
    const admin = await Admin.findById(req.user.id).select("+password");
    const isPasswordMatched = await admin.comparePassword(password);
  
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Password is Incorrect", 400));
    }
  
    const fee = await Fee.findById(req.params.id);
    if (fee === null) {
      return next(new ErrorHandler("not found", 404));
    }

    await Fee.findByIdAndDelete(req.params.id);
  
    res.status(200).json({
      success: true,
      message: "record deleted successfully",
    });
  });