const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LectureSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Please add a name'],
	},
	day: {
		type: Number,
		min: 0,
		max: 6,
		required: [true, 'Please specify a day'],
	},
	time: {
		type: String,
		match: [
			/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
			'Please enter valid time 24hr format',
		],
		required: [true, 'Please add a date'],
	},
	duration: {
		type: Number,
		required: [true, 'Please add a duration'],
	},
	type: {
		type: String,
		enum: ['regular', 'extra'],
		required: [true, 'Please add a class type'],
	},
	subject: {
		type: [String],
		enum: ['maths', 'science', 'english', 'hindi', 'sst'],
		required: [true, 'Please select a subject'],
	},
	student: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: true,
		},
	],
	byUser: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
	createdAt: { type: Date, default: Date.now() },
});

module.exports = mongoose.model('Lecture', LectureSchema);
