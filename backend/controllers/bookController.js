const Book = require("../models/bookModel");
const SchoolStudent = require("../models/schoolStudentModel");
const CollegeStudent = require("../models/collegeStudentModel");
const Staff = require("../models/staffModel");
const Admin = require("../models/adminModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const path = require("path");
const XLSX = require("xlsx");
const fs = require('fs');

exports.createBook = catchAsyncErrors(async (req, res, next) => {
  const book = await createNewBookEntry(req,res,next);
  res.status(201).json({
    success: true,
    book,
  });
});

exports.updateBook = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }
  let book = Book.findById(req.params.id);

  if (!book)
    return res.status(500).json({
      success: false,
      message: "book not found",
    });

  book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    book,
  });
});

exports.getAllBooks = catchAsyncErrors(async (req, res, next) => {
  const apiFeature = new ApiFeatures(Book.find(), req.query).search();
  const books = await apiFeature.query;
  const booksCount = books.length;
  const studentsListAfterApplyingPagination = await new ApiFeatures(
    Book.find(),
    req.query
  )
    .search()
    .sort()
    .pagination().query;
  res.status(200).json({
    success: true,
    books: studentsListAfterApplyingPagination,
    booksCount,
  });
});

exports.getBook = catchAsyncErrors(async (req, res, next) => {
  const book = await Book.findById(req.params.id);
  if (book === null) return next(new ErrorHandler("book not found", 404));

  res.status(200).json({
    success: true,
    book,
  });
});

exports.bookWithdraw = catchAsyncErrors(async (req, res, next) => {
  const { password, number, borrowerName, borrowerPhone } = req.body;

  // Check if the admin's password is correct
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  // Create a search query for finding the user
  const searchQuery = {
    name: new RegExp(`^${borrowerName}$`, "i"), // Case-insensitive search by name
    phone: borrowerPhone, // Exact match by phone
  };

  // Search for the user in the three collections
  let user = await SchoolStudent.findOne(searchQuery);
  if (!user) user = await CollegeStudent.findOne(searchQuery);
  if (!user) user = await Staff.findOne(searchQuery);

  // If the user is not found in any of the collections, return an error
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Find the book by its number
  const book = await Book.findOne({ number });
  if (!book) {
    return next(new ErrorHandler("Book not found", 404));
  }

  // Check if the book is currently with the library
  if (book.bookWith !== "library") {
    return next(new ErrorHandler("Book not with library", 400));
  }

  // Update the book details
  book.bookWith = borrowerName;
  book.lastGiver = admin.name;
  book.lastIssuedOn = Date.now();

  // Create a record to add to the user's list of borrowed books
  const temp = {
    book: number,
    issuedBy: admin.name,
    bookName: book.name,
    fine:book.cost + 50,
  };

  // Add the book to the user's list of books
  user.books.push(temp);

  // Save the updated book and user information
  await book.save({ validateBeforeSave: false });
  await user.save({ validateBeforeSave: false });

  // Return the updated book and user information
  res.status(200).json({
    success: true,
    book,
    user,
  });
});

exports.bookReturn = catchAsyncErrors(async (req, res, next) => {
  const { password, number, returnerName, returnerPhone } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const searchQuery = {
    name: new RegExp(`^${returnerName}$`, "i"), // Case-insensitive search by name
    phone: returnerPhone, // Exact match by phone
  };

  let user = await SchoolStudent.findOne(searchQuery);
  if (!user) user = await CollegeStudent.findOne(searchQuery);
  if (!user) user = await Staff.findOne(searchQuery);

  if (user === null) {
    return next(new ErrorHandler("user not found", 404));
  }

  const book = await Book.findOne({ number });
  if (book === null) return next(new ErrorHandler("book not found", 404));
  if (book.bookWith === "library")
    return next(new ErrorHandler("book already returned", 400));

  let temp = false;
  const arr = [];
  user.books.forEach((ele) => {
    if (ele.book == number) {
      temp = true;
    } else arr.push(ele);
  });
  if (temp === false) {
    return next(new ErrorHandler("book not issued by this user", 404));
  }
  book.bookWith = "library";
  book.lastAcceptor = admin.name;

  user.books = arr;

  await book.save({ validateBeforeSave: false });
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    book,
    user,
  });
});

exports.deleteBook = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const admin = await Admin.findById(req.user.id).select("+password");
  const isPasswordMatched = await admin.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Password is Incorrect", 400));
  }

  const book = await Book.findById(req.params.id);
  if (book === null) {
    return next(new ErrorHandler("book not found", 404));
  }

  if (book.bookWith !== "library")
    return next(new ErrorHandler("book is yet to be returned", 404));

  await Book.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Book deleted successfully",
  });
});

exports.tempFunction = catchAsyncErrors(async (req, res, next) => {
  // Fetch all books where bookWith is not 'library'
  const books = await Book.find({ bookWith: { $ne: 'library' } });

  // Iterate through each book to find the corresponding user
  for (let book of books) {
    // Create a case-insensitive regular expression for exact name match
    const searchQuery = { name: new RegExp(`^${book.bookWith}$`, 'i') };

    let user = await SchoolStudent.findOne(searchQuery);
    if (!user) user = await CollegeStudent.findOne(searchQuery);
    if (!user) user = await Staff.findOne(searchQuery);

    // If a user is found
    if (user) {
      // Initialize books as an empty array if it is undefined
      if (!user.books) {
        user.books = [];
      }

      // Check if the book is already in the user's books array
      const isBookInUserBooks = user.books.some(
        (userBook) => userBook.book === book.number
      );

      // If the book is not in the user's books array, add it
      if (!isBookInUserBooks) {
        user.books.push({
          book: book.number,
          issuedBy: book.lastGiver || 'Prasanta Joshi', // Assuming 'lastGiver' is the field that stores who issued it
          bookName: book.name,
          fine: book.cost + 50,
        });
        
        // Save the user document with the updated books array
        await user.save({ validateBeforeSave: false });
      }
    }
  }

  res.status(200).json({
    success: true,
    message: "Books array updated for users where necessary.",
  });
});


exports.createBooksFromExcelFile = catchAsyncErrors(
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
      for (const book of jsonData) {
        try {
          // Modify req.body for each student and pass it to createCollegeStudent
          req.body = {
            name: book.name,
            number: book.number,
            author: book.author ?? "unknown",
            category: book.category ?? "unknown",
            cost: book.cost,
            yearOfEdition: book.yearOfEdition,   
          };
          console.log(req.body);
          await createNewBookEntry(req, res, next);
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


async function createNewBookEntry(req, res, next) {
  req.body.name = req.body.name.toUpperCase();
  let existingBook = await Book.findOne({ number: req.body.number });
  if (existingBook && existingBook != null) {
    return existingBook;
  }
  const book = await Book.create(req.body);
  return book;
 }
 