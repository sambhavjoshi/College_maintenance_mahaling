const mongoose = require("mongoose");


const miscSchema = new mongoose.Schema({
    ongoingYear: Number,
    name:{
        type:String,
        default:"sambhav",
    },
});

module.exports = mongoose.model("Misc", miscSchema);
