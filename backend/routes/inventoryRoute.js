const express = require("express");
const { isAuthUser} = require("../middleware/auth");
const { createNewInventory,addToStock,removeFromStock,deleteStock,createStock,getInventory,getStock, updateStock, getAllStocks, tempFunc, createItemsFromExcelFile } = require("../controllers/inventoryController");

const router = express.Router();

router.route("/createStock").post(isAuthUser, createStock);
router.route("/createStock/file").post(isAuthUser, createItemsFromExcelFile);
router.route("/stocks").get(isAuthUser,getAllStocks);
router.route("/stock/add/:id").put(isAuthUser,addToStock);
router.route("/stock/remove/:id").put(isAuthUser,removeFromStock);
router
  .route("/stock/:id")
  .get(isAuthUser, getStock)
  .put(isAuthUser,updateStock)
  .post(isAuthUser, deleteStock);

module.exports = router;