const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const newUserSchema = new Schema({
	email: {
		type: String,
		match: [
			/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
			'Please add a valid email',
		],
		required: [true, 'Please add an email'],
	},

	teacher: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
	initiateRegistration: String,
	initiateRegistrationExpire: Date,
});

// Generate and hash password token
newUserSchema.methods.getInitiateRegistrationToken = function () {
	// Generate token
	const resetToken = crypto.randomBytes(20).toString('hex');

	// Hash token and set to resetPasswordToken field
	this.initiateRegistration = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	// Set expire
	this.initiateRegistrationExpire = Date.now() + 10 * 60 * 1000;

	return resetToken;
};

// Sign JWT and return
newUserSchema.methods.getSignedJWT = function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
		expiresIn: process.env.JWT_EXPIRES,
	});
};

module.exports = mongoose.model('NU', newUserSchema);
