const express = require('express');
const {
	getAssignments,
	getAssignment,
	createAssignment,
	updateAssignment,
	deleteAssignment,
	uploadTeacherMaterial,
} = require('../controllers/assignment');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

router
	.route('/')
	.get(protect, getAssignments)
	.post(protect, authorize('teacher'), createAssignment);

router
	.route('/:id')
	.get(protect, getAssignment)
	.put(protect, authorize('teacher'), updateAssignment)
	.delete(protect, authorize('teacher'), deleteAssignment);

router
	.route('/:id/teacher/upload')
	.put(protect, authorize('student'), uploadTeacherMaterial);

module.exports = router;
