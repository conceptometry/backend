const asyncHandler = require('../middlewares/async');
const advancedResultsFindBy = require('../utils/advancedResultsFindBy');
const User = require('../models/user');
const path = require('path');
const { findByIdAndUpdate } = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');
const aws = require('aws-sdk');

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

// @desc   Get all students
// @route  GET /api/v1/users/student
// @access Private (teacher)
exports.getStudents = asyncHandler(async (req, res, next) => {
  advancedResultsFindBy(
    User,
    { role: 'student', teacher: req.user.id },
    req,
    res
  );
});

// @desc   Get student
// @route  GET /api/v1/users/:id
// @access Private (teacher)
exports.getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorResponse(`User with id ${id} does not exist`, 404));
  } else if (user.teacher.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Only teacher can access user information`, 401)
    );
  } else {
    res.status(200).json({ success: true, message: user });
  }
});

// @desc   Update student
// @route  PUT /api/v1/users/:id
// @access Private (teacher)
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorResponse(`No user found with id ${id}`, 404));
  } else if (user.teacher.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Only teacher can edit the students information`, 401)
    );
  } else {
    const { _id, teacher, createdAt, password, role } = req.body;
    if (_id || teacher || createdAt || password || role) {
      return next(
        new ErrorResponse(
          `Field/fields cannot be modified after registration`,
          401
        )
      );
    } else {
      const newUser = await User.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      res.status(200).json({
        success: true,
        message: `Updated user ${newUser.name}`,
        data: newUser,
      });
    }
  }
});

// @desc   Update Logged In user
// @route  PUT /api/v1/users/me
// @access Private
exports.updateMe = asyncHandler(async (req, res, next) => {
  if (
    req.body.password ||
    req.body.email ||
    req.body.phone ||
    req.body.username ||
    req.body.teacher ||
    req.body.role
  ) {
    return next(
      new ErrorResponse(
        `Some field/fields can't be updated, contact your teacher for assistance. To change your password go to change password section`,
        400
      )
    );
  }

  const user = await findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    message: user,
  });
});

// @desc   Update user Profile Photo
// @route  PUT /api/v1/users/me/photo
// @access Private
exports.updateProfilePhoto = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }
  const file = req.files.file;
  // check file type
  if (!file.mimetype.startsWith('image/jpeg' || 'image/jpg')) {
    return next(new ErrorResponse(`Please upload a jpeg file`, 400));
  }
  // check file size
  const fileSizeInMB = Math.round(process.env.STUDENT_MAX_FILE_SIZE / 1000000);
  if (file.size > process.env.STUDENT_MAX_FILE_SIZE) {
    return next(
      new ErrorResponse(
        `Please upload a file smaller than ${fileSizeInMB} MB`,
        400
      )
    );
  }

  // rename file
  file.name = `${req.user.id}${path.parse(file.name).ext}`;

  aws.config.update({
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPACES_ACCESS_KEY,
  });

  const spacesEndpoint = new aws.Endpoint(process.env.SPACES_ENDPOINT);
  const s3 = new aws.S3({
    endpoint: spacesEndpoint,
  });
  const blob = req.files.file.data;
  const params = {
    Bucket: process.env.SPACES_NAME,
    Key: `uploads/usr/profile-images/${file.name}`,
    Body: blob,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  s3.upload(params, async function (err, data) {
    if (err) {
      console.log(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(data);
      }
      const url = data.Location;
      const filePath = `${
        url.split('digitaloceanspaces.com')[0]
      }cdn.digitaloceanspaces.com${url.split('digitaloceanspaces.com')[1]}`;
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          profilePhoto: filePath,
        },
        {
          new: true,
          runValidators: true,
        }
      );
      res.status(200).json({
        success: true,
        message: `Updated profile phone`,
        data: user,
      });
    }
  });
});

// @desc   Update Password for Logged In user
// @route  PUT /api/v1/users/me/password
// @access Private
exports.updateUserPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc   Get Logged In user
// @route  GET /api/v1/users/me
// @access Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // user is already available in req due to the protect middleware
  const user = req.user;

  res.status(200).json({
    success: true,
    message: user,
  });
});
