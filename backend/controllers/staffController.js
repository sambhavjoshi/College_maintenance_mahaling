const Admin = require("../models/adminModel");
const Staff = require("../models/staffModel");
const Misc = require("../models/miscModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary");
const path = require('path');
const fs = require('fs');

exports.createStaff = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);
  
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  req.body.name = req.body.name ? req.body.name.toUpperCase() : undefined;
  req.body.designation = req.body.designation ? req.body.designation.toUpperCase() : undefined;
  req.body.subject = req.body.subject ? req.body.subject.toUpperCase() : undefined;
  req.body.qualification = req.body.qualification ? req.body.qualification.toLowerCase() : undefined;
  req.body.lastMonthPaid = req.body.dateOfJoining;

  const uploadDir = path.join(__dirname, '..', 'uploads', req.body.phone);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileFields = ['photo', 'pgCertificate', 'appointment', 'aadhar'];

  for (const field of fileFields) {
    if (req.files && req.files[field]) {
      const file = req.files[field];
      const filePath = path.join(uploadDir, `${field}.pdf`);

      // Move the file to the desired directory
      file.mv(filePath, (err) => {
        if (err) {
          return next(new ErrorHandler(`Failed to upload ${field}`, 500));
        }
        console.log(`${field} uploaded to ${filePath}`);
      });

      // Add the file path to the req.body to save in the database
      req.body[field] = `/uploads/${req.body.phone}/${field}.pdf`;
    }
  }

  const staff = await Staff.create(req.body);

  res.status(201).json({
    success: true,
    staff,
  });
});

exports.getAllStaff = catchAsyncErrors(async(req,res,next) => {
   const apiFeature = new ApiFeatures(Staff.find(),req.query).search();
   const staffs = await apiFeature.query;
   const staffsCount = staffs.length;
   const staffListAfterPagination = await new ApiFeatures(Staff.find(),req.query).search().sort().pagination().query;
   res.status(200).json({
      success: true,
      staffs:staffListAfterPagination,
      staffsCount
   });
 });

exports.getStaffDetails = catchAsyncErrors(async(req,res,next) => {
     const staff = await Staff.findById(req.params.id);
     if(staff === null) return next(new ErrorHandler("Staff not found",404));
     res.status(200).json({
      success:true,
      staff,
     });
}); 

exports.deleteStaff = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    return next(new ErrorHandler("Staff not found", 404));
  }

  const staffFolder = path.join(__dirname, '..', 'uploads', staff.phone);

  // Check if the folder exists and remove it
  if (fs.existsSync(staffFolder)) {
    fs.rmdirSync(staffFolder, { recursive: true });
    console.log(`Directory ${staffFolder} deleted successfully.`);
  } else {
    console.log(`Directory ${staffFolder} does not exist.`);
  }

  await Staff.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Staff removed successfully",
  });
});



exports.updateStaff = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;

  // Authenticate the admin
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  // Find the staff member by ID
  const staf = await Staff.findById(req.params.id);
  if (staf === null) return next(new ErrorHandler("Staff not found", 404));

  // Directory where the staff's files are stored
  const staffFolder = path.join(__dirname, '..', 'uploads', staf.phone);

  // Handle file uploads for photo, pgCertificate, aadhar, and appointment
  const fileFields = ['photo', 'pgCertificate', 'aadhar', 'appointment'];
  
  for (const field of fileFields) {
    if (req.files && req.files[field]) {
      const file = req.files[field];
      const filePath = path.join(staffFolder, `${field}.pdf`);

      // If the directory doesn't exist, create it
      if (!fs.existsSync(staffFolder)) {
        fs.mkdirSync(staffFolder, { recursive: true });
      }

      // Check if the file already exists and delete it if it does
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Save the new file
      file.mv(filePath, (err) => {
        if (err) {
          return next(new ErrorHandler(`Failed to save ${field}`, 500));
        }
      });

      // Store the path to the file in the request body
      req.body[field] = `/uploads/${staf.phone}/${field}.pdf`
    }
  }

  // Handle the rest of the update logic
  if (staf.lastMonthPaid == null) {
    req.body.lastMonthPaid = req.body.salaryClearedTill ? req.body.salaryClearedTill : null;
  } else if (req.body.salaryClearedTill != null) {
    const date1 = new Date(req.body.salaryClearedTill);
    const date2 = new Date(staf.lastMonthPaid);

    if (date1 > date2) {
      req.body.lastMonthPaid = req.body.salaryClearedTill;
      req.body.deductionLeaves = 0;
    }
  }

  const leaves = staf.leavesUsed;
  if (req.body.leavesUsed && req.body.leavesUsed > leaves) {
    if (req.body.leavesUsed > staf.leavesAllowed) req.body.deductionLeaves = staf.deductionLeaves + 1;
  }

  // Update the staff member's data
  const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    staff,
  });
});


exports.refreshLeaves = catchAsyncErrors(async(req,res,next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }
  console.log("password clear")
  const staffs = await Staff.find();

  staffs.forEach(async(staff) => {
    const updatedStaff = await Staff.findByIdAndUpdate(staff._id,{
      leavesUsed : 0,
    },{
      new: true,
      runValidators: true,
      useFindAndModify: false,
    })
  })
  
  console.log("all staffs updated");

  const current = await Misc.findOne({name:"sambhav"});
  await Misc.findByIdAndUpdate(current._id,{ongoingYear:current.ongoingYear+1},{
    new: true,
    runValidators: true,
    useFindAndModify: false,
  },)

  console.log("year updated");
  
  res.status(200).json({
    success:true,
    message:"Staffs updated successfully"
  })
})


exports.getCurrentYear = catchAsyncErrors(async(req,res,next) => {
    const current = await Misc.findOne({name:"sambhav"});
  
  res.status(200).json({
    success:true,
    currentYear:current.ongoingYear,
  })
})