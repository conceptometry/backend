const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
	let token;
	if (req.headers.authorization) {
		token = req.headers.authorization.split(' ')[1];
	}
	if (req.cookies !== undefined && req.cookies.token) {
		token = req.cookies.token;
	}

	// Make sure token exists
	if (!token) {
		return next(new ErrorResponse('Not authorized to access this route', 401));
	}

	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		req.user = await User.findById(decoded.id)
			.select('-resetPasswordExpire -resetPasswordToken')
			.populate({ path: 'teacher', select: 'name subject' });
		if (req.user.isActive === false) {
			return next(new ErrorResponse('Only active users can login', 401));
		}
		if (process.env.NODE_ENV === 'development') {
			console.log(decoded);
		}
		next();
	} catch (err) {
		return next(new ErrorResponse('Not authorized to access this route', 401));
	}
});

// Role based permission
exports.authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new ErrorResponse(
					`User with role ${req.user.role} is not authorized to access this route`,
					403
				)
			);
		}
		next();
	};
};
