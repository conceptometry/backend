const express = require('express');
const router = express.Router();
const {
	createLecture,
	getLectures,
	getLecture,
	updateLecture,
	deleteLecture,
	getNextLectures,
} = require('../controllers/lecture');
const { protect, authorize } = require('../middlewares/auth');

router.route('/next').get(protect, getNextLectures);
router
	.route('/')
	.get(protect, getLectures)
	.post(protect, authorize('teacher'), createLecture);
router
	.route('/:id')
	.get(protect, getLecture)
	.put(protect, authorize('teacher'), updateLecture)
	.delete(protect, authorize('teacher'), deleteLecture);

module.exports = router;
