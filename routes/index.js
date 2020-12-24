const express = require('express');
const router = express.Router({ mergeParams: true });

// Import route files
const auth = require('./auth');
const assignment = require('./assignment');
const submissions = require('./assignmentSubmission');
const lectures = require('./lecture');
const users = require('./user');

// API v1 Routes
router.use('/auth', auth);
router.use('/assignments', assignment);
router.use('/submissions', submissions);
router.use('/lectures', lectures);
router.use('/users', users);

module.exports = router;
