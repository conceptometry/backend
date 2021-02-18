const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const sendEmail = require('../utils/sendEmail');
const NU = require('../models/newUser');
const crypto = require('crypto');

const sendTokenResponse = (user, status, res) => {
  // Give back a token
  const token = user.getSignedJWT();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV !== 'development') {
    options.secure = true;
  }

  res
    .status(status)
    .cookie('token', token, options)
    .json({
      success: true,
      message: true,
      token,
      user: {
        _id: user._id,
        subject: user.subject,
        name: user.name,
        role: user.role,
        profilePhoto: user.profilePhoto,
        feePayed: user.feePayed,
        isActive: user.isActive,
        email: user.email,
        grade: user.grade,
        phone: user.phone,
        parentsName: user.parentsName,
        parentsEmail: user.parentsEmail,
      },
    });
};

// @desc   Send mail for user registration
// @route  POST /api/v1/auth/initiateuser
// @access Private
exports.sendMailToInitiateUser = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const teacher = req.user.id;
  await NU.create({ email, teacher });

  try {
    const user = await NU.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorResponse('There is no user with that email', 404));
    }

    // Get reset token
    const token = user.getInitiateRegistrationToken();
    if (process.env.NODE_ENV === 'development') {
      console.log(token);
    }

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const registerURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/register/${token}`;

    const message = `You are receiving this email because you (or someone else) has initiated your childs registration. Please make a PUT request to: \n\n ${registerURL}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Register Now',
        message,
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.log(err);
      }
      user.initiateRegistration = undefined;
      user.initiateRegistrationExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// @desc   Get Logged In user
// @route  GET /api/v1/auth/register/:registerToken
// @access Private
exports.register = asyncHandler(async (req, res, next) => {
  const registerToken = crypto
    .createHash('sha256')
    .update(req.params.registerToken)
    .digest('hex');

  const user = await NU.findOne({
    initiateRegistration: registerToken,
    initiateRegistrationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(
      new ErrorResponse(`A user with the same email already exists`, 400)
    );
  } else {
    req.body.teacher = user.teacher;
    await User.create(req.body);
    user.delete();
  }
  sendTokenResponse(user, 200, res);
});

// @desc   Login user
// @route  POST /api/v1/auth/login
// @access Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // Validate emil & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  if (user.isActive === false) {
    return next(
      new ErrorResponse(`You can't login, please contact your teacher`, 401)
    );
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc   Reset Password
// @route  POST /api/v1/auth/forgotpassword
// @access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `http://192.168.29.75:3000/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.log(err);
    }
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc   Get Logged In user
// @route  GET /api/v1/auth/resetpassword/:resetpasswordtoken
// @access Private
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetpasswordtoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
});
