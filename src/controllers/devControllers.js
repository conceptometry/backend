const asyncHandler = require('../middlewares/async');
const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');

// @desc   Dev Register
// @route  POST /api/v1/auth/register
// @access Public
exports.register = asyncHandler(async (req, res, next) => {
	const newUser = await User.create(req.body);
	res.status(201).json({
		success: true,
		message: newUser,
	});
});
