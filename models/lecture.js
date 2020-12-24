const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const Schema = mongoose.Schema;

const LectureSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Please add a name'],
	},
	eventTime: {
		type: Date,
		required: [true, 'Please add a date and time for the lecture'],
	},
	duration: {
		type: Number,
		required: [true, 'Please add a duration'],
	},
	occured: {
		type: Boolean,
		default: false,
	},
	cancelled: {
		type: Boolean,
		default: false,
	},
	lectureCode: { type: String, default: nanoid(8) },
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
