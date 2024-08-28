const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: String,
  cost: Number,
  stock: Number,
  damaged:{
    type:Number,
    default:0,
  },
  dateOfPurchase:{
    type:String,
  },
  lab:String,
  log: [
    {
      category: String,
      stock: Number,
      date: {
        type: Date,
        default: Date.now(),
      },
      cost: Number,
      approvedBy: String,
      totalCost: Number,
      askedBy:String,
    },
  ],
});

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
