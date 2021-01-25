const Lecture = require('../models/lecture');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const advancedResultsFindBy = require('../utils/advancedResultsFindBy');

// @desc   Get all lectures
// @route  GET /api/v1/lecture
// @access Private
exports.getLectures = asyncHandler(async (req, res, next) => {
	let findBy;
	if (req.user.role === 'student') {
		findBy = { student: req.user._id };
	} else if (req.user.role === 'teacher') {
		findBy = { byUser: req.user._id };
	}

	advancedResultsFindBy(Lecture, findBy, req, res, next);
});

// @desc   Get lecture by ID
// @route  GET /api/v1/lecture/:id
// @access Private
exports.getLecture = asyncHandler(async (req, res, next) => {
	const lecture = await Lecture.findById(req.params.id);
	if (!lecture) {
		return next(
			new ErrorResponse(`No lecture found for id ${req.params.id}`, 404)
		);
	} else if (
		req.user.role === 'student' &&
		lecture.student.toString() !== req.user.id
	) {
		return next(
			new ErrorResponse(
				`Only students attending the lecture can access the route`,
				401
			)
		);
	} else if (
		req.user.role === 'teacher' &&
		lecture.byUser.toString() !== req.user.id
	) {
		return next(
			new ErrorResponse(
				`Only the teacher who has created lecture can access the route`,
				401
			)
		);
	} else {
		if (
			req.user.role === 'student' &&
			req.user.id !== lecture.student.toString()
		) {
			return next(
				new ErrorResponse(`Only students in lecture can access the route`, 400)
			);
		}
		if (
			req.user.role === 'teacher' &&
			req.user.id !== lecture.byUser.toString()
		) {
			return next(
				new ErrorResponse(
					`Only the teacher who has made the lecture can access the route`,
					400
				)
			);
		}

		{
			advancedResultsFindBy(Lecture, { _id: req.params.id }, req, res, next, {
				path: 'byUser',
				select: 'name',
			});
		}
	}
});

// @desc   Update lecture
// @route  PUT /api/v1/lecture/:id
// @access Private (teacher)
exports.updateLecture = asyncHandler(async (req, res, next) => {
	const lecture = await Lecture.findById(req.params.id);
	if (!lecture) {
		return next(
			new ErrorResponse(`Could not find lecture with id ${req.params.id}`, 404)
		);
	} else if (lecture.byUser.toString() !== req.user.id) {
		return next(new ErrorResponse(`Only owner can edit the lecture`, 401));
	} else {
		const updatedLecture = await Lecture.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			}
		);
		res.status(200).json({
			success: true,
			message: `Lecture has been updated successfully`,
			data: updatedLecture,
		});
	}
});

// @desc   Delete Lecture
// @route  DELETE /api/v1/lecture/:id
// @access Private (teacher)
exports.deleteLecture = asyncHandler(async (req, res, next) => {
	const lecture = await Lecture.findById(req.params.id);
	if (!lecture) {
		return next(
			new ErrorResponse(`Could not find lecture with id ${req.params.id}`, 404)
		);
	} else if (lecture.byUser.toString() !== req.user.id) {
		return next(new ErrorResponse(`Only owner can delete the lecture`, 400));
	} else {
		await Lecture.findByIdAndDelete(req.params.id);
		res.status(200).json({
			success: true,
			message: `Lecture with id ${lecture._id} has been deleted`,
		});
	}
});

// @desc   New Lecture
// @route  POST /api/v1/lecture
// @access Private (teacher)
exports.createLecture = asyncHandler(async (req, res, next) => {
	req.body.byUser = req.user._id;
	const lecture = await Lecture.create(req.body);
	res.status(201).json({
		success: true,
		message: `New lecture has been created`,
		data: lecture,
	});
});
