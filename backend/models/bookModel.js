const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: [true, "Please enter book number"],
    unique: [true, "Please enter an unique book number"], // yahan error hoskti hai
  },
  name: {
    type: String,
    required: [true, "Please Enter Name"],
  },
  author: {
    type: String,
  },
  bookWith: {
    type: String,
    default: "library",
  },
  cost: {
    type: Number,
    default: 500,
  },
  yearOfEdition: {
    type: Number,
    default: 0,
  },
  category:String,
  lastGiver:String,
  lastAcceptor:String,
  lastIssuedOn:{
    type:Date,
  }
});

module.exports = mongoose.model("Book", bookSchema);
