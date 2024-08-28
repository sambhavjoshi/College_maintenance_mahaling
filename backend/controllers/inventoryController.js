const Admin = require("../models/adminModel");
const Item = require("../models/itemModel")
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const path = require("path");
const XLSX = require("xlsx");
const fs = require('fs');


exports.createStock = catchAsyncErrors(async(req,res,next) => {
    const item = await createNewItemEntry(req,res,next);   
    
    res.status(201).json({
        success: true,
        item
    });
});  


exports.updateStock = catchAsyncErrors(async(req,res,next) => {
    const { password } = req.body;
    const admin = await Admin.findById(req.user.id).select("+password");
    const isPasswordMatched = await admin.comparePassword(password);
    console.log(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Password is Incorrect", 400));
    }
    await Item.findByIdAndUpdate(req.params.id,req.body);
    const item = await Item.findById(req.params.id);
    res.status(201).json({
        success: true,
        item
    });
});  

exports.addToStock = catchAsyncErrors(async(req,res,next) => {
    const { password } = req.body;
    const admin = await Admin.findById(req.user.id).select("+password");
    const isPasswordMatched = await admin.comparePassword(password);
    console.log(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Password is Incorrect", 400));
    }
    const item = await Item.findById(req.params.id);
    const newLog = {
        category:"ADD",
        totalCost: req.body.cost * req.body.stock,
        stock:req.body.stock,
        approvedBy:admin.name,
        cost:req.body.cost,
        askedBy:req.body.askedBy,
        date:Date.now()
    }
    item.stock += Number(req.body.stock);
    item.log.push(newLog);
    item.cost = Math.max(item.cost,req.body.cost);
    await item.save({ validateBeforeSave: false });
    res.status(201).json({
        success: true,
        item
    });
});  


exports.removeFromStock = catchAsyncErrors(async(req,res,next) => {
    const { password } = req.body;
    const admin = await Admin.findById(req.user.id).select("+password");
    const isPasswordMatched = await admin.comparePassword(password);
    console.log(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Password is Incorrect", 400));
    }
    const item = await Item.findById(req.params.id);
    const newLog = {
        category:"REMOVE",
     //   totalCost: req.body.cost * req.body.stock,
        stock:req.body.stock,
        approvedBy:admin.name,
        cost:item.cost,
        totalCost:item.cost*req.body.stock,
        askedBy:req.body.askedBy,
       // cost:req.body.cost,
    }
    item.stock = Math.max(item.stock - req.body.stock,0);
    item.log.push(newLog);
    await item.save({ validateBeforeSave: false });
    res.status(201).json({
        success: true,
        item
    });
});  

exports.deleteStock = catchAsyncErrors(async(req,res,next) => {
    const { password } = req.body;
    const admin = await Admin.findById(req.user.id).select("+password");
    const isPasswordMatched = await admin.comparePassword(password);
    console.log(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Password is Incorrect", 400));
    }
    await Item.findByIdAndDelete(req.params.id);
    res.status(201).json({
        success: true,
    });
});  


exports.getStock = catchAsyncErrors(async(req,res,next) => {
    const item = await Item.findById(req.params.id);
    res.status(201).json({
        success: true,
        item
    });
});  

exports.getAllStocks = catchAsyncErrors(async(req,res,next) => {
  const apiFeatures = new ApiFeatures(Item.find(),req.query).search();
  const items = await apiFeatures.query;
  const itemsCount = items.length;
  const itemsListAfterApplyingPagination = await (new ApiFeatures(Item.find(),req.query).search().sort().pagination()).query;
  res.status(200).json({
    success: true,
    items:itemsListAfterApplyingPagination,
    itemsCount,
  });
});


exports.createItemsFromExcelFile = catchAsyncErrors(
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
      for (const item of jsonData) {
        try {
          // Modify req.body for each student and pass it to createCollegeStudent
          req.body = {
            name:item.name.toUpperCase(),
            cost: item.cost,
            dateOfPurchase: item.dateOfPurchase ?? "unknown",
            stock: item.stock,
            lab: item.lab,
          };
          console.log(req.body);
          await createNewItemEntry(req, res, next);
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


async function createNewItemEntry(req, res, next) {
  let existingItem = await Item.findOne({name:req.body.name});
  if(existingItem && existingItem!=null) return existingItem;
  const admin = await Admin.findById(req.user.id);
  const item = await Item.create(req.body);
  if(req.body.stock != 0) {
    item.log.push({
      ...req.body,
      category:"ADD",
      totalCost: (req.body.cost)*(req.body.stock),
      approvedBy:admin.name
    })
  }
  
  await item.save({validateBeforeSave:false});
  return item;
 }
