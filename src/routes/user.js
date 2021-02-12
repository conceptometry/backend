const express = require('express');
const router = express.Router();
const {
	getStudents,
	getMe,
	updateMe,
	updateUserPassword,
	updateUser,
	getUser,
	updateProfilePhoto,
} = require('../controllers/user');
const { authorize, protect } = require('../middlewares/auth');

router.route('/student').get(protect, authorize('teacher'), getStudents);
router.route('/me/password').put(protect, updateUserPassword);
router.route('/me/photo').put(protect, updateProfilePhoto);
router.route('/me').get(protect, getMe).put(protect, updateMe);
router
	.route('/:id')
	.get(protect, authorize('teacher'), getUser)
	.put(protect, authorize('teacher'), updateUser);

module.exports = router;
