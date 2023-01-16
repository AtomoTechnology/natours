const crypto = require('crypto');
const { promisify } = require('util');
const catchAsync = require('../helpers/catchAsync');
const User = require('./../model/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('../helpers/AppError');
const Email = require('../helpers/email');
const Tour = require('../model/tourModel');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_TOKEN_NATOURS, {
    expiresIn: process.env.SECRET_TOKEN_NATOURS_INSPIRE_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = createToken(user._id);
  const cookieOptions = {
    expiresIn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  await res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  //bad practice
  const newUser = await User.create(req.body);
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  // });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  //create token
  createSendToken(newUser, 201, res);
});
exports.logout = async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 0.2 * 1000),
    httpOnly: true,
  });
  // const tours = await Tour.find();

  // res.status(200).render('overview', {
  //   title: 'All Tours',
  //   tours,
  // });

  res.status(200).json({ status: 'success' });
};

exports.signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //validate email and password
  if (!email || !password) {
    return next(new AppError('Provide a email and a password please.', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  //validate user and password
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or  password.', 401));
  }

  //create token
  createSendToken(user, 200, res);
});

exports.delete = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      user: null,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //getting token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //validate token
  if (!token) {
    return next(new AppError('You are not logged , please log in to get access!', 401));
  }

  //vaerify token
  const decoded = await promisify(jwt.verify)(token, process.env.SECRET_TOKEN_NATOURS);

  //check if user exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user does no longer exist', 401));
  }

  //check if user change the password
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError('This user recently changed his password . Please log in again', 401));
  }

  //grant the access
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.SECRET_TOKEN_NATOURS);
      console.log('tok', req.cookies);
      console.log(decoded);

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      console.log('user : ', currentUser);

      // 3) Check if user changed password after the token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      console.log('user : ', currentUser);
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this application', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get the user and validate it
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('This is no user with this email ..', 404));
  }

  //2) generate the random  token
  const resetToken = user.createPasswordResetToken();

  // we just modify data from the object  we have to save it
  await user.save({ validateBeforeSave: false }); //

  //send email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was a problem sending the email ', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get Uer based on the token
  const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashToken, passwordResetExpires: { $gt: Date.now() } });

  if (!user) {
    return next(new AppError('This is no user for this token. Token invalid or expired ..', 404));
  }

  //validate user and token
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //Log in user again
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get the user
  const user = await User.findOne({ email: req.user.email }).select('+password');

  //check password
  if (!user || !(await user.checkPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Wrong password', 401));
  }

  //update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //User.findByIdAndUpdate() will not work

  //log in user
  createSendToken(user, 200, res);
});
