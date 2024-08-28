const express = require('express');
const { isAuthUser} = require("../middleware/auth");
const { createStaff, getAllStaff, getStaffDetails, updateStaff, deleteStaff, refreshLeaves, getCurrentYear, createMisc } = require('../controllers/staffController');

const router = express.Router();

router.route("/staff/create").post(isAuthUser,createStaff);
router.route("/staff/refresh").put(isAuthUser,refreshLeaves);
router.route("/staff/currentYear").get(isAuthUser,getCurrentYear);
router.route("/staffs").get(isAuthUser,getAllStaff);
router
      .route("/staff/:id")
      .get(isAuthUser,getStaffDetails)
      .put(isAuthUser,updateStaff)
      .post(isAuthUser,deleteStaff);

module.exports = router;
