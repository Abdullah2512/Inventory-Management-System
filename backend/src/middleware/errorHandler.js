function errorHandler(error, req, res, next) {
  const status = error.status || error.statusCode || 500;

  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({
    success: false,
    message: error.message || "Internal server error"
  });
}

module.exports = errorHandler;
