const express = require('express');
const helmet = require('helmet');
const dotenv = require('dotenv');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errors');
const dbConnect = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const expressMongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
require('colors');

// Import routes file
const v1Routes = require('./routes');

// Get environment variables
dotenv.config({
	path: './config/config.env',
});

// Initialize App
const app = express();

// Use cors
const corsOrigin = [
	'http://127.0.0.1:3000',
	'http://127.0.0.1:8080',
	'http://192.168.29.75:3000',
	'https://student.conceptometry.com',
	'https://conceptometryteachers.vercel.app',
];
const corsOptions = {
	origin: corsOrigin,
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Sanitize response
app.use(expressMongoSanitize());

// Initialize Helmet
app.use(helmet());

// Prevent cross site scripting
app.use(xss());

// Rate limit an IP
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 279,
});

app.use(limiter);

// Prevent hpp param polution
app.use(hpp());

// Use express fileupload
app.use(fileupload());

// Set static file location
app.use(express.static(path.join(__dirname, 'public')));

// Enable JSON
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
	if (req.query.limit < 1 || req.query.page < 1) {
		return res.status(400).json({
			success: false,
			message: 'Invalid arguments passed',
		});
	} else {
		next();
	}
});

// Use routes file
app.use('/api/v1', v1Routes);

// Use error handler
app.use(errorHandler);

// Use cookie parser
app.use(cookieParser());

// Use morgan
app.use(morgan('dev'));

// If we are in development mode, server base route
if (process.env.NODE_ENV === 'development') {
	app.get('/', (req, res) => {
		res.status(200).json({
			success: true,
			message: `The API is working on port ${process.env.PORT}`,
		});
	});
}

// Connect to DB
dbConnect();

// Make app listen
const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
	console.log(
		`Server running on port ${port} in ${process.env.NODE_ENV} mode`.green.bold
	);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
	console.log(`Error [UHP]: ${err.message}`.red.underline);
	// Close server connection
	server.close(() => process.exit(1));
});

// End All
