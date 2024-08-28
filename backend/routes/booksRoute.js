const express = require("express");
const { isAuthUser } = require("../middleware/auth");
const {
  createBook,
  getAllBooks,
  getBook,
  bookWithdraw,
  bookReturn,
  deleteBook,
  updateBook,
  tempFunction,
  createBooksFromExcelFile,
} = require("../controllers/bookController");
const router = express.Router();

router.route("/books").get(getAllBooks);
router.route("/books/update").get(tempFunction);
router.route("/book/new").post(isAuthUser, createBook);
router.route("/book/create/file").post(isAuthUser, createBooksFromExcelFile);
router.route("/book/withdraw").put(isAuthUser, bookWithdraw);
router.route("/book/return").put(isAuthUser, bookReturn);
router
  .route("/book/:id")
  .get(getBook)
  .put(isAuthUser, updateBook)
  .post(isAuthUser, deleteBook); // alag se route banake delete likhna bhi same hai

module.exports = router;
