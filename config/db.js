const mongoose = require('mongoose');

// Connect to database (mongo db)
const dbConnect = async () => {
	const DB_URI = process.env.MONGODB_URI;
	const conn = await mongoose.connect(DB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	});

	console.log(`MongoDB Connected: ${conn.connection.host}`.yellow.bold);
};

module.exports = dbConnect;
