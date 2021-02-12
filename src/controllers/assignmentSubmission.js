const AssignmentSubmission = require('../models/assignmentSubmission');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const Assignment = require('../models/assignment');
const { nanoid } = require('nanoid');
const path = require('path');
const advancedResultsFindBy = require('../utils/advancedResultsFindBy');
const moment = require('moment');

// @desc   Get all assignments
// @route  GET /api/v1/submissions
// @access Private
exports.getSubmissions = asyncHandler(async (req, res, next) => {
	let findBy;

	if (req.user.role === 'student') {
		findBy = { user: req.user.id };
	}

	// Do a query
	advancedResultsFindBy(
		AssignmentSubmission,
		findBy,
		req,
		res,
		next,
		{ path: 'assignment', select: 'name byUser' },
		{ path: 'user', select: 'name' }
	);
});

// @desc   Get all assignments
// @route  GET /api/v1/submission/:id
// @access Private
exports.getSubmission = asyncHandler(async (req, res, next) => {
	const submission = await AssignmentSubmission.findById(req.params.id);
	if (!submission) {
		return next(
			new ErrorResponse(`No submission with id ${req.params.id}`, 404)
		);
	} else {
		if (req.user.role === 'teacher') {
			const assignment = await Assignment.findById(submission.assignment);

			if (assignment.byUser.toString() !== req.user.id) {
				return next(new ErrorResponse(`Only owner can access this assignment`));
			}
			advancedResultsFindBy(
				AssignmentSubmission,
				{ _id: req.params.id },
				req,
				res,
				next,
				{ path: 'assignment', select: 'name' },
				{ path: 'user', select: 'name' }
			);
		} else if (req.user.role === 'student') {
			if (req.user.id !== submission.user.toString()) {
				return next(new ErrorResponse(`Only owner can access submission`, 400));
			}

			advancedResultsFindBy(
				AssignmentSubmission,
				{ _id: req.params.id },
				req,
				res,
				next
			);
		}
	}
});

// @desc   Get submissions by assignment
// @route  GET /api/v1/submissions/get/:assignmentId
// @access Private
exports.getSubmissionsByAssignment = asyncHandler(async (req, res, next) => {
	const a = await Assignment.findById(req.params.assignmentId);
	if (!a) {
		return next(
			new ErrorResponse(
				`No assignment found with id ${req.params.assignmentId}`,
				404
			)
		);
	}
	if (a.byUser.toString() !== req.user.id) {
		return next(
			new ErrorResponse(
				`Only the assignment owner has access to assignment`,
				400
			)
		);
	} else {
		advancedResultsFindBy(
			AssignmentSubmission,
			{
				assignment: req.params.assignmentId,
			},
			req,
			res,
			next,
			{ path: 'assignment', select: 'name' },
			{ path: 'user', select: 'name' }
		);
	}
});

// @desc   Get my Submission for a Assignment
// @route  GET /api/v1/submissions/get/:assignmentId/my
// @access Private (student)
exports.getMySubmissionForAssignment = asyncHandler(async (req, res, next) => {
	const a = await Assignment.findById(req.params.assignmentId);
	if (!a) {
		return next(
			new ErrorResponse(
				`No assignment found with id ${req.params.assignmentId}`,
				404
			)
		);
	} else {
		advancedResultsFindBy(
			AssignmentSubmission,
			{
				assignment: req.params.assignmentId,
				user: req.user.id,
			},
			req,
			res
		);
	}
});

// @desc   Teacher can mark my submission
// @route  PUT /api/v1/submissions/:id/mark
// @access Private (Teacher)
exports.markSubmission = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const {
		submissionMaterials,
		submissionText,
		submissionDate,
		assignment,
		user,
		marks,
		remarks,
	} = req.body;
	const submission = await AssignmentSubmission.findById(id);
	const findAssignment = await Assignment.findById(submission.assignment);
	if (!submission) {
		return next(new ErrorResponse(`No submission with id ${id}`, 404));
	} else if (!findAssignment) {
		return next(new ErrorResponse(`No assignment with id ${id}`, 404));
	} else if (findAssignment.byUser.toString() !== req.user.id) {
		return next(
			new ErrorResponse(`Only assignment owner can grade submissions`, 403)
		);
	} else if (
		submissionMaterials ||
		submissionText ||
		submissionDate ||
		assignment ||
		user
	) {
		return next(new ErrorResponse(`These fields cannot be edited`, 401));
	} else if (!marks || !remarks) {
		return next(new ErrorResponse(`These fields cannot be left blank`, 400));
	} else {
		const newSubmission = await AssignmentSubmission.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			}
		);
		res.status(200).json({
			success: true,
			message: 'Assignment remarks have been submitted',
			data: newSubmission,
		});
	}
});

// @desc   Submit Assignment
// @route  POST /api/v1/submissions/submit/:assignmentId
// @access Private (student)
exports.createSubmission = asyncHandler(async (req, res, next) => {
	const findAssignment = await Assignment.findById(req.params.assignmentId);
	if (!findAssignment) {
		return next(
			new ErrorResponse(
				`Assignment not found with ID of ${req.params.assignmentId}`,
				404
			)
		);
	}
	if (!req.body.submissionText) {
		return next(new ErrorResponse(`Please add a submission text`, 400));
	}
	const sa = await AssignmentSubmission.findOne({
		user: req.user._id,
		assignment: req.params.assignmentId,
	});
	if (sa) {
		return next(new ErrorResponse(`Your response cannot be modified`, 403));
	}
	if (!req.files) {
		return next(new ErrorResponse(`Please upload a file`, 400));
	}
	const file = req.files.file;
	// check file type
	if (!file.mimetype.startsWith('application/pdf')) {
		return next(new ErrorResponse(`Please upload a pdf file`, 400));
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
	file.name = `assignment-response_${nanoid(24)}${path.parse(file.name).ext}`;

	file.mv(
		`${process.env.STUDENT_ASSIGNMENT_MATERIALS_UPLOAD_PATH}/${file.name}`,
		async (err) => {
			if (err) {
				console.log(err);
				return next(new ErrorResponse(`Problem with file upload`, 500));
			}
			const submissionMaterials = `${req.protocol}://${req.get(
				'host'
			)}/uploads/student/assignments/${file.name}`;
			const user = req.user._id;
			const assignment = req.params.assignmentId;
			const { submissionText } = req.body;
			let late;
			if (moment() > moment(findAssignment.dueDate)) {
				late = true;
			} else {
				late = false;
			}
			await AssignmentSubmission.create({
				submissionMaterials,
				user,
				assignment,
				submissionText,
				late: late,
			});
			res.status(200).json({
				success: true,
				message: `Response has been submitted`,
			});
		}
	);
});
