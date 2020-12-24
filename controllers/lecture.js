const Lecture = require('../models/lecture');
const User = require('../models/user');
const moment = require('moment');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const advancedResultsFindBy = require('../utils/advancedResultsFindBy');

// @desc   Get all lectures
// @route  GET /api/v1/lecture
// @access Private
exports.getLectures = asyncHandler(async (req, res, next) => {
	let findBy;
	if (req.user.role === 'student') {
		findBy = { student: req.user.id };
	}
	if (req.user.role === 'teacher') {
		findBy = { teacher: req.user.id };
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
				400
			)
		);
	} else if (
		req.user.role === 'teacher' &&
		lecture.byUser.toString() !== req.user.id
	) {
		return next(
			new ErrorResponse(
				`Only the teacher who has created lecture can access the route`,
				400
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
		return next(new ErrorResponse(`Only owner can edit the lecture`, 400));
	} else {
		const { fromDate, fromTime, eventTime } = req.body;
		if (eventTime) {
			return next(
				new ErrorResponse(`You cannot enter eventTime directly`, 403)
			);
		}
		if (fromDate && fromTime) {
			req.body.byUser = req.user._id;

			const dateEntered = fromDate;
			const timeEnteredFrom = fromTime;
			const from = `${dateEntered}, ${timeEnteredFrom}`;

			const date = from.split(', ')[0];
			const time = from.split(', ')[1];
			if (!time) {
				return next(new ErrorResponse(`Please add a time`));
			}
			if (!date) {
				return next(new ErrorResponse(`Please add a date`));
			}
			if (!time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
				return next(new ErrorResponse(`Please enter a valid time`));
			}
			if (
				!date.match(
					/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/
				)
			) {
				return next(new ErrorResponse(`Please enter a valid date`));
			} else {
				if (moment(from, 'DD/MM/YYYY, HH:mm') < moment()) {
					return next(
						new ErrorResponse(
							`Please enter a date greater than the current date`
						)
					);
				} else {
					const dateObj = moment(from, 'DD/MM/YYYY, HH:mm').toISOString();
					req.body.eventTime = dateObj;

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
						message: updatedLecture,
					});
				}
			}
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
				message: updatedLecture,
			});
		}
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
	const { fromDate, fromTime, eventTime } = req.body;
	if (eventTime) {
		return next(new ErrorResponse(`You cannot enter eventTime directly`, 403));
	} else {
		req.body.byUser = req.user._id;
		const dateEntered = fromDate;
		const timeEnteredFrom = fromTime;
		const from = `${dateEntered}, ${timeEnteredFrom}`;

		const date = from.split(', ')[0];
		const time = from.split(', ')[1];
		if (!time) {
			return next(new ErrorResponse(`Please add a time`));
		}
		if (!date) {
			return next(new ErrorResponse(`Please add a date`));
		}
		if (!time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
			return next(new ErrorResponse(`Please enter a valid time`));
		}
		if (
			!date.match(
				/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/
			)
		) {
			return next(new ErrorResponse(`Please enter a valid date`));
		} else {
			if (moment(from, 'DD/MM/YYYY, HH:mm') < moment()) {
				return next(
					new ErrorResponse(`Please enter a date greater than the current date`)
				);
			} else {
				const dateObj = moment(from, 'DD/MM/YYYY, HH:mm').toISOString();
				req.body.eventTime = dateObj;
				const lecture = await Lecture.create(req.body);
				res.status(201).json({
					success: true,
					message: lecture,
				});
			}
		}
	}
});
