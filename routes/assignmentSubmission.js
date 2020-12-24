const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
	getSubmissions,
	getSubmission,
	createSubmission,
	getSubmissionsByAssignment,
	getMySubmissionForAssignment,
	markSubmission,
} = require('../controllers/assignmentSubmission');

router.route('/').get(protect, authorize('student'), getSubmissions);

router.route('/:id/mark').put(protect, authorize('teacher'), markSubmission);
router.route('/:id').get(protect, getSubmission);
router
	.route('/get/:assignmentId/my')
	.get(protect, authorize('student'), getMySubmissionForAssignment);
router
	.route('/get/:assignmentId')
	.get(protect, authorize('teacher'), getSubmissionsByAssignment);
router
	.route('/submit/:assignmentId')
	.post(protect, authorize('student'), createSubmission);

module.exports = router;
