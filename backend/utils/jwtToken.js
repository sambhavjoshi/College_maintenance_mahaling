//creating token and saving in cookie

const sendToken = (admin, statusCode, res) => {
  const token = admin.getJWTToken();

  //options for cookie
  const options = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    admin,
  });
};

module.exports = sendToken;
