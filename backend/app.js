const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middleware/error");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const path = require("path");

if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "backend/config/config.env" });
}

app.use(
  express.json({
    limit: "100mb",
  })
); // so that whatever we get from is in json format
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

// importing Routes
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
  createParentPath: true
}));
//app.use(express.raw({ type: "*/*", limit: "50mb" }));


const users = require("./routes/userRoute.js");
const books = require("./routes/booksRoute.js");
const admin = require("./routes/adminRoute.js");
const fees  = require("./routes/feeRoute.js");
const schoolStudents = require("./routes/schoolStudentRoute.js");
const collegeStudents = require("./routes/collegeStudentRoute.js"); 
const inventory = require("./routes/inventoryRoute.js");
const staff = require("./routes/staffRoute.js");

app.use("/api/v1", users);
app.use("/api/v1", books);
app.use("/api/v1", admin);
app.use("/api/v1", fees);
app.use("/api/v1",schoolStudents);
app.use("/api/v1",collegeStudents);
app.use("/api/v1", inventory);
app.use("/api/v1",staff);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

// middleware for errors
app.use(errorMiddleware);
module.exports = app;
