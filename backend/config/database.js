const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose.connect(process.env.DB_URI).then((data) => {
    console.log(`mongoDB connected at ${process.env.DB_URI}`);
  });
};

module.exports = connectDatabase;
