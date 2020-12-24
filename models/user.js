const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Please enter your name'],
	},
	parentsName: {
		type: String,
		required: [true, 'Please enter your parents name'],
	},
	email: {
		type: String,
		match: [
			/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
			'Please add a valid email',
		],
		required: [true, 'Please add an email'],
		unique: [true, 'This is email is already in use by another user'],
	},
	parentsEmail: {
		type: String,
		match: [
			/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
			'Please add a valid email',
		],
		required: [true, 'Please add your parents email'],
	},
	phone: {
		type: Number,
		min: [7000000000, 'Please enter a valid phone number'],
		minlength: [10, 'Phone number has to be 10 digits long'],
		maxlength: [10, 'Phone number can not be longer than 10 digits'],
		required: [true, 'Please add in your phone number'],
	},
	subject: {
		type: [String],
		enum: ['maths', 'science', 'english', 'hindi', 'sst'],
		required: [true, 'Please select a subject'],
	},
	profilePhoto: {
		type: String,
		// match: [
		// 	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
		// 	'Please add a valid URL',
		// ],
		default: 'no-photo.jpg',
		required: false,
	},
	grade: {
		type: String,
		enum: ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
		required: [true, 'Please select a grade'],
	},
	feePayed: {
		type: Boolean,
		default: false,
	},
	feeDueDate: {
		type: Date,
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	role: {
		type: 'String',
		enum: ['student', 'teacher'],
		default: 'student',
	},
	password: {
		type: 'String',
		required: [true, 'Please add a password'],
		minlength: [6, 'Password should be 6+ characters'],
		select: false,
	},
	createdAt: {
		type: 'Date',
		default: Date.now(),
	},
	teacher: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: true,
		},
	],
	resetPasswordToken: String,
	resetPasswordExpire: Date,
});

// Cascade assignments on delete
UserSchema.pre('remove', async function (next) {
	await this.model('Assignment').deleteMany({ byUser: this._id });
	next();
});

// Cascade assignments on delete
UserSchema.pre('remove', async function (next) {
	await this.model('Lecture').deleteMany({ byUser: this._id });
	next();
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJWT = function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
		expiresIn: process.env.JWT_EXPIRES,
	});
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
	// Generate token
	const resetToken = crypto.randomBytes(20).toString('hex');

	// Hash token and set to resetPasswordToken field
	this.resetPasswordToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	// Set expire
	this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

	return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
