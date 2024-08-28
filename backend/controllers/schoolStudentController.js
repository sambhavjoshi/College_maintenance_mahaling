const Admin = require("../models/adminModel");
const Fee = require("../models/feeModel");
const SchoolStudent = require("../models/schoolStudentModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const path = require("path");
const XLSX = require("xlsx");
const fs = require('fs');

exports.createSchoolStudent = catchAsyncErrors(async (req, res, next) => {
  const schoolStudent = await createNewSchoolStudentEntry(req,res,next);

  res.status(201).json({
    success: true,
    schoolStudent,
  });
});

exports.getAllSchoolStudents = catchAsyncErrors(async (req, res, next) => {
  const apiFeature = new ApiFeatures(SchoolStudent.find(), req.query).search();
  const schoolStudents = await apiFeature.query;
  const studentsCount = schoolStudents.length;
  const studentsListAfterApplyingPagination = await (new ApiFeatures(SchoolStudent.find(), req.query).search().sort().pagination()).query;
  res.status(200).json({
    success: true,
    schoolStudents:studentsListAfterApplyingPagination,
    studentsCount,
  });
});

exports.getschoolStudent = catchAsyncErrors(async (req, res, next) => {
  const schoolStudent = await SchoolStudent.findById(req.params.id);
  if (schoolStudent === null)
    return next(new ErrorHandler("student not found", 404));

  res.status(200).json({
    success: true,
    schoolStudent,
  });
});

exports.updateSchoolStudent = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const schoolStu = await SchoolStudent.findById(req.params.id);
  if (schoolStu === null) {
    return next(new ErrorHandler("student not found", 404));
  }

  const feearr = await Fee.findOne({
    hostel: req.body.hostel,
    stream: req.body.stream,
    grade: req.body.grade,
  });

  const fee2 = await Fee.findOne({
    hostel: schoolStu.hostel,
    stream: schoolStu.stream,
    grade: schoolStu.grade,
  });

  const remAmount = feearr.amount - fee2.amount;
  req.body.name = req.body.name ? req.body.name.toUpperCase() : undefined;
  req.body.sonOf.name = req.body.sonOf.name
    ? req.body.sonOf.name.toUpperCase()
    : undefined;
  req.body.stream = req.body.stream ? req.body.stream.toUpperCase() : undefined;
  if (req.body.grade !== schoolStu.grade) {
    req.body.feeLeft = feearr.amount + schoolStu.feeLeft;
  } else {
    req.body.feeLeft = schoolStu.feeLeft + remAmount;
  }
  await SchoolStudent.findByIdAndUpdate(req.params.id, req.body);
  const schoolStudent = await SchoolStudent.findById(req.params.id);

  res.status(200).json({
    success: true,
    schoolStudent,
  });
});

exports.updateGrade = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const schoolStu = await SchoolStudent.findById(req.params.id);
  if (schoolStu === null) {
    return next(new ErrorHandler("student not found", 404));
  }

  const feearr = await Fee.findOne({
    hostel: req.body.hostel ? req.body.hostel : false,
    stream: schoolStu.stream,
    grade: req.body.grade,
  });

  req.body.feeLeft = feearr.amount + schoolStu.feeLeft - req.body.discount;

  await SchoolStudent.findByIdAndUpdate(req.params.id, req.body);
  const schoolStudent = await SchoolStudent.findById(req.params.id);
  res.status(200).json({
    success: true,
    schoolStudent,
  });
});

exports.payFeeSchool = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const schoolStudent = await SchoolStudent.findById(req.params.id);
  if (schoolStudent === null) {
    return next(new ErrorHandler("student not found", 404));
  }
  if (req.body.amount <= 0 || req.body.amount > 1000000)
    return next(new ErrorHandler("Payment amount is invalid", 400));

  const temp = {
    ...req.body,
    acceptedBy: admin.name,
  };

  schoolStudent.feePayments.push(temp);
  schoolStudent.feeLeft -= req.body.amount;
  schoolStudent.feePaid += Number(req.body.amount);
  await schoolStudent.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    schoolStudent,
  });
});

exports.deleteSchoolStudent = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const schoolStudent = await SchoolStudent.findById(req.params.id);
  if (schoolStudent === null) {
    return next(new ErrorHandler("student not found", 404));
  }

  await SchoolStudent.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "student deleted successfully",
  });
});



exports.createSchoolStudentsFromExcelFile = catchAsyncErrors(
  async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(new ErrorHandler("No files were uploaded", 400));
    }
    // Accessing the uploaded Excel file
    let uploadedFile = req.files.file;

    // Move the file to the uploads directory (considering the relative path)
    const filePath = path.join(__dirname, "..", "uploads", uploadedFile.name);
    let couldNotCreate = [];
    uploadedFile.mv(filePath, async (err) => {
      if (err) {
        return res.status(500).send(err);
      }
      try {
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);

        // Assuming the first sheet is the one you want to process
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert the sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
      //  console.log(jsonData);
      for (const student of jsonData) {
        try {
          // Modify req.body for each student and pass it to createCollegeStudent
          req.body = {
            name: student.name ? student.name.toUpperCase() : undefined,
            sonOf: {
              name: student.sonOf ? student.sonOf.toUpperCase() : undefined,
              phone: student.parentsPhone,
            },
            stream: student.stream ? student.stream.toUpperCase() : undefined,
            hostel: student.hostel.toUpperCase() == "YES" ? true: false,
            grade: student.grade,
            discounted: student.discounted,
            address: student.address,
            phone: student.phone,
            rollNo: student.rollNo,
          };
          console.log(req.body);
          await createNewSchoolStudentEntry(req, res, next);
        } catch (error) {
          // Handle errors for individual students (e.g., log them, continue processing others)
          couldNotCreate.push(student);
        }
      }

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Failed to delete the file:', err);
        } else {
          console.log('File deleted successfully');
        }
      });

      } catch (error) {
        return next(new ErrorHandler(error, 400));
      }
    });
    if(couldNotCreate.length > 0) return next(new ErrorHandler(`could not create students ${couldNotCreate}`))
    res.status(200).json({
      success: true,
      message: "file processed successfully",
    });
  }
);


async function createNewSchoolStudentEntry(req, res, next) {
  // console.log(req.body);
  let existingStudent = await SchoolStudent.findOne({rollNo:req.body.rollNo});
  if(existingStudent && existingStudent != null) return existingStudent ;
  req.body.name = req.body.name ? req.body.name.toUpperCase() : undefined;
  req.body.sonOf.name = req.body.sonOf.name
    ? req.body.sonOf.name.toUpperCase()
    : undefined;
  req.body.stream = req.body.stream ? req.body.stream.toUpperCase() : undefined;
  const feearr = await Fee.findOne({
    hostel: req.body.hostel,
    stream: req.body.stream,
    grade: req.body.grade,
  });
  const fee = feearr.amount;
  req.body.feeLeft = req.body.discounted ? fee - req.body.discounted : fee;
  req.body.feePayments = {
    amount: 0,
    paidBy: "demo payment",
    acceptedBy: "System",
    receiptNo: String(Date.now()),
  };
  req.body.books = [];

  const schoolStudent = await SchoolStudent.create(req.body);
  return schoolStudent;
 }
