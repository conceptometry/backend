const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSchema = new Schema(
	{
		name: { type: String, required: [true, 'Please add a name'] },
		description: { type: String, required: [true, 'Please add a description'] },
		teacherMaterials: {
			type: String,
			// match: [
			// 	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
			// 	'Please add a valid URL',
			// ],
			default: 'No file has been uploaded',
		},
		dueDate: { type: Date, required: [true, 'Please enter a date'] },
		student: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'User',
				required: [true, 'Please add the assigned students'],
			},
		],
		byUser: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
		createdAt: { type: Date, default: Date.now() },
	},
	{ toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Reverse Populate submissions
AssignmentSchema.virtual('submission', {
	ref: 'AssignmentSubmission',
	localField: '_id',
	foreignField: 'assignment',
	justOne: false,
});

// Cascade submissions on delete
AssignmentSchema.pre('remove', async function (next) {
	await this.model('AssignmentSubmission').deleteMany({ assignment: this._id });
	next();
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
