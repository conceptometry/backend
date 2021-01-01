const asyncHandler = require('../middlewares/async');
const advancedResultsFindBy = require('../utils/advancedResultsFindBy');
const User = require('../models/user');
const { findByIdAndUpdate } = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');

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
			res.status(200).json({ success: true, message: newUser });
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
	if (!file.mimetype.startsWith('image/jpeg' || 'image/png' || 'image/jpg')) {
		return next(new ErrorResponse(`Please upload a jpeg or a png file`, 400));
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
	file.name = `profile-image_${req.user.id}${path.parse(file.name).ext}`;
	file.mv(
		`${process.env.PROFILE_IMAGE_UPLOAD_PATH}/${file.name}`,
		async (err) => {
			if (err) {
				console.log(err);
				return next(new ErrorResponse(`Problem with file upload`, 500));
			}

			const user = await findByIdAndUpdate(
				req.user.id,
				{
					profilePhoto: `${req.protocol}://${req.get(
						'host'
					)}/uploads/user/profile-image/${file.name}`,
				},
				{
					new: true,
					runValidators: true,
				}
			);
			res.status(200).json({
				success: true,
				message: user,
			});
		}
	);
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
