const express = require("express");
const { isAuthUser } = require("../middleware/auth");
const {loginAdmin,logoutAdmin,updateAdminPhone,updatePassword,getAdminDetails} = require("../controllers/adminController")
const router = express.Router();

router.route("/login").post(loginAdmin);
router.route("/logout").get(logoutAdmin);
router.route("/me").get(isAuthUser, getAdminDetails);
router.route("/update/phone").put(isAuthUser, updateAdminPhone);
router.route("/update/password").put(isAuthUser, updatePassword);

module.exports = router;
