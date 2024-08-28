const Admin = require("../models/adminModel");
const Fee = require("../models/feeModel");
const CollegeStudent = require("../models/collegeStudentModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const path = require("path");
const XLSX = require("xlsx");
const fs = require('fs');

exports.createCollegeStudent = catchAsyncErrors(async (req, res, next) => {
  const collegeStudent = await createNewCollegeStudentEntry(req,res,next);
  res.status(201).json({
    success: true,
    collegeStudent,
  });
});

exports.getAllCollegeStudents = catchAsyncErrors(async (req, res, next) => {
  const apiFeature = new ApiFeatures(CollegeStudent.find(), req.query).search();
  const collegeStudents = await apiFeature.query;
  const studentsCount = collegeStudents.length;
  const studentsListAfterApplyingPagination = await new ApiFeatures(
    CollegeStudent.find(),
    req.query
  )
    .search()
    .sort()
    .pagination().query;
  res.status(200).json({
    success: true,
    collegeStudents: studentsListAfterApplyingPagination,
    studentsCount,
  });
});

exports.getCollegeStudent = catchAsyncErrors(async (req, res, next) => {
  const collegeStudent = await CollegeStudent.findById(req.params.id);
  if (collegeStudent === null)
    return next(new ErrorHandler("student not found", 404));

  res.status(200).json({
    success: true,
    collegeStudent,
  });
});

exports.updateCollegeStudent = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const collegeStu = await CollegeStudent.findById(req.params.id);
  if (collegeStu.hostel != req.body.hostel) {
    const feearr = await Fee.findOne({
      hostel: req.body.hostel,
      stream: req.body.stream,
      degree: req.body.degree,
      semester: req.body.semester,
    });

    const fee2 = await Fee.findOne({
      hostel: collegeStu.hostel,
      stream: collegeStu.stream,
      degree: collegeStu.degree,
      semester: collegeStu.semester,
    });

    const remAmount = feearr.amount - fee2.amount;
    req.body.feeLeft = collegeStu.feeLeft + remAmount;
  }

  await CollegeStudent.findByIdAndUpdate(req.params.id, req.body);
  const collegeStudent = await CollegeStudent.findById(req.params.id);
  res.status(200).json({
    success: true,
    collegeStudent,
  });
});

exports.updateSemester = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const collegeStu = await CollegeStudent.findById(req.params.id);

  if (collegeStu === null) {
    return next(new ErrorHandler("student not found", 404));
  }

  const data = {
    hostel: req.body.hostel ? req.body.hostel : false,
    stream: collegeStu.stream,
    degree: collegeStu.degree,
    semester: req.body.semester,
  };
  console.log(data);
  const feearr = await Fee.findOne(data);

  req.body.feeLeft = feearr.amount + collegeStu.feeLeft - req.body.discount;

  await CollegeStudent.findByIdAndUpdate(req.params.id, req.body);
  const collegeStudent = await CollegeStudent.findById(req.params.id);
  res.status(200).json({
    success: true,
    collegeStudent,
  });
});

exports.payFeeCollege = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);
  console.log(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const collegeStudent = await CollegeStudent.findById(req.params.id);
  if (collegeStudent === null) {
    return next(new ErrorHandler("student not found", 404));
  }

  if (req.body.amount <= 0 || req.body.amount > 1000000 )
    return next(new ErrorHandler("Payment amount is invalid", 400));

  const temp = {
    ...req.body,
    acceptedBy: admin.name,
  };

  collegeStudent.feePayments.push(temp);
  collegeStudent.feeLeft -= req.body.amount;
  collegeStudent.feePaid = collegeStudent.feePaid + Number(req.body.amount);
  await collegeStudent.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    collegeStudent,
  });
});

exports.deleteCollegeStudent = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const collegeStudent = await CollegeStudent.findById(req.params.id);
  if (collegeStudent === null) {
    return next(new ErrorHandler("student not found", 404));
  }

  await CollegeStudent.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "student deleted successfully",
  });
});

exports.createCollegeStudentsFromExcelFile = catchAsyncErrors(
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
            degree: student.degree ? student.degree.toUpperCase() : undefined,
            hostel: student.hostel.toUpperCase() == "YES" ? true: false,
            semester: student.semester,
            discounted: student.discounted,
            address: student.address,
            phone: student.phone,
            rollNo: student.rollNo,
          };
          console.log("creating student with rollNo",req.body.rollNo);
          await createNewCollegeStudentEntry(req, res, next);
          console.log("created student with rollNO",req.body.rollNo);
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


async function createNewCollegeStudentEntry(req, res, next) {
  let existingStudent = await CollegeStudent.findOne({rollNo : req.body.rollNo});
  if(existingStudent && existingStudent != null) {
    return existingStudent;
  } 
  req.body.name = req.body.name ? req.body.name.toUpperCase() : undefined;
  req.body.sonOf.name = req.body.sonOf.name
    ? req.body.sonOf.name.toUpperCase()
    : undefined;
  req.body.stream = req.body.stream ? req.body.stream.toUpperCase() : undefined;
  req.body.degree = req.body.degree ? req.body.degree.toUpperCase() : undefined;

  const feearr = await Fee.findOne({
    hostel: req.body.hostel,
    stream: req.body.stream,
    degree: req.body.degree,
    semester: req.body.semester,
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

  const collegeStudent = await CollegeStudent.create(req.body);
  console.log(collegeStudent);
  return collegeStudent;
}
