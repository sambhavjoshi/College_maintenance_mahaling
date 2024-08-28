const Admin = require("../models/adminModel");
const Book = require("../models/bookModel");
const SchoolStudent = require("../models/schoolStudentModel");
const CollegeStudent = require("../models/collegeStudentModel");
const Staff = require("../models/staffModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");


exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  // Fetch all users from the three collections, selecting only the required fields
  const [staff, schoolStudents, collegeStudents] = await Promise.all([
    Staff.find({}, '_id name phone books'),
    SchoolStudent.find({}, '_id name phone books'),
    CollegeStudent.find({}, '_id name phone books'),
  ]);

  // Add the parent field to each user
  const staffWithParent = staff.map(user => ({ ...user._doc, parent: 'staff' }));
  const schoolStudentsWithParent = schoolStudents.map(user => ({ ...user._doc, parent: 'schoolStudent' }));
  const collegeStudentsWithParent = collegeStudents.map(user => ({ ...user._doc, parent: 'collegeStudent' }));

  // Combine all the users into a single array
  let allUsers = [...staffWithParent, ...schoolStudentsWithParent, ...collegeStudentsWithParent];

  // Apply filters
  if (req.query.name) {
    const nameRegex = new RegExp(req.query.name, 'i'); // 'i' for case-insensitive
    allUsers = allUsers.filter(user => nameRegex.test(user.name));
  }

  if (req.query.phone) {
    const phoneRegex = new RegExp(req.query.phone, 'i'); // 'i' for case-insensitive
    allUsers = allUsers.filter(user => phoneRegex.test(user.phone));
  }

  // Apply sorting
  if (req.query.sortBy) {
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder === 'true' ? -1 : 1; // -1 for descending, 1 for ascending
    allUsers.sort((a, b) => {
      if(req.query.sortBy == "books"){
        if (a[sortBy].length < b[sortBy].length) return -sortOrder;
        if (a[sortBy].length > b[sortBy].length) return sortOrder;
      }
      else{
      if (a[sortBy] < b[sortBy]) return -sortOrder;
      if (a[sortBy] > b[sortBy]) return sortOrder;
      }
      return 0;
    });
  }

  // Apply pagination
  const limit = parseInt(req.query.limit, 10) || 100000000; // Default limit is 10
  const cursor = parseInt(req.query.cursor, 10) || 0; // Default cursor is 0 (start from the beginning)
  const paginatedUsers = allUsers.slice(cursor, cursor + limit);

  const usersCount = allUsers.length;

  // Return the response
  res.status(200).json({
    success: true,
    usersCount,
    users: paginatedUsers,
  });
});


exports.paidFine = catchAsyncErrors(async (req, res, next) => {
  const { password, id, number } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  let user = await SchoolStudent.findById(id);
  if(!user) user = await CollegeStudent.findById(id);
  if(!user) user = await Staff.findById(id);

  if (user === null) {
    return next(new ErrorHandler("user not found", 404));
  }
  const arr = [];
  user.books.forEach((ele) => {
    if (ele.book != number) arr.push(ele);
  });

  user.books = arr;

  const book = await Book.findOne({ number });
  await Book.findByIdAndDelete(book._id);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    user,
  });
});


/*
mongodb+srv://degreecollegemodern:modern_college_2013@library.2nzj1wb.mongodb.net/?retryWrites=true&w=majority
*/