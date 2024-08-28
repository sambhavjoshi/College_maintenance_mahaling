const express = require("express");
const { isAuthUser} = require("../middleware/auth");
const { createFee, getAllFees, getFee, updateFee, deleteFee } = require("../controllers/feeController");

const router = express.Router();

router.route("/fee/create").post(isAuthUser, createFee);
router.route("/fees").get(isAuthUser, getAllFees);
router
  .route("/fee/:id")
  .get(isAuthUser, getFee)
  .put(isAuthUser,updateFee)
  .post(isAuthUser, deleteFee);

module.exports = router;