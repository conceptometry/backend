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

router.route('/initiateuser').post(sendMailToInitiateUser);
router.route('/register/:registerToken').post(register);
router.route('/forgotpassword').post(forgotPassword);
router.route('/resetpassword/:resetpasswordtoken').put(resetPassword);
router.route('/login').post(login);

// Dev Routes
if (process.env.NODE_ENV === 'development') {
	const devRoute = require('../controllers/devControllers');
	router.route('/register').post(devRoute.register);
}

module.exports = router;
