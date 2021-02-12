const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assignmentSubmissionSchema = new Schema({
	submissionMaterials: {
		type: String,
		// match: [
		// 	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
		// 	'Please add a valid URL',
		// ],
		default: 'nofile',
	},
	submissionText: {
		type: String,
		required: [true, 'Please add a submission comment'],
	},
	marks: {
		type: Number,
		min: [1, 'Minimum value allowed is 1'],
		max: [10, 'Maximum value allowed is 10'],
	},
	remarks: { type: String, default: 'No remarks have been given' },
	submissionDate: { type: Date, default: Date.now() },
	late: { type: Boolean, default: false },
	assignment: {
		type: mongoose.Schema.ObjectId,
		ref: 'Assignment',
		required: true,
	},
	user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model(
	'AssignmentSubmission',
	assignmentSubmissionSchema
);
