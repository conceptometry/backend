const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
	sendMailToInitiateUser,
	register,
	login,
	forgotPassword,
	resetPassword,
} = require('../controllers/auth');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 60, // limit each IP to 50 requests per windowMs
});

const limit = rateLimit({
	windowMs: 12 * 60 * 1000, // 15 minutes
	max: 80, // limit each IP to 50 requests per windowMs
});

router.route('/initiateuser').post(sendMailToInitiateUser, limit);
router.route('/register/:registerToken').post(register, limit);
router.route('/forgotpassword').post(forgotPassword, limit);
router.route('/resetpassword/:resetpasswordtoken').put(resetPassword, limit);
router.route('/login').post(login, loginLimiter);

// Dev Routes
if (process.env.NODE_ENV === 'development') {
	const devRoute = require('../controllers/devControllers');
	router.route('/register').post(devRoute.register);
}

module.exports = router;
