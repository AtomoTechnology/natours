const AppError = require('../helpers/AppError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  console.log(err);
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
    });
  } else {
    console.log('ERROR ', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong !! Try again please...',
      error: err,
    });
  }
};

const handleDuplicateFieldsDB = (error) => {
  // const value = error.errmsg.match(/"(.*?)"/);
  // console.log(value);
  const field = Object.keys(error.keyPattern)[0];
  const values = Object.values(error.keyValue)[0];
  const message = `Duplicate ${field} : ${values}`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path} : ${error.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJsonWebTokenError = () => new AppError(`Invalid token. Please log in again!`, 401);

const handleJWTExpiredToken = () => new AppError('Your token has expired . Log in again please. ', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = { ...err };
    console.log(err);
    let error = Object.assign(err);
    // if (error.kind === 'ObjectId') error = handleCastErrorDB(error);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredToken();
    sendErrorProd(error, res);
  }
};
