const express = require("express");
const { isAuthUser} = require("../middleware/auth");
const {
  getAllUsers,
  paidFine,
} = require("../controllers/userController");
const router = express.Router();

router.route("/users").get(isAuthUser, getAllUsers);
router.route("/user/payfine").put(isAuthUser, paidFine);  

module.exports = router;
