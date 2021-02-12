const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

const sendMail = async (option) => {
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		auth: {
			user: process.env.SMTP_EMAIL,
			pass: process.env.SMTP_PASSWORD,
		},
	});

	const message = {
		from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
		bcc: option.email,
		subject: option.subject,
		text: option.message,
	};

	const info = await transporter.sendMail(message);

	if (process.env.NODE_ENV === 'development') {
		console.log('Message sent: %s', info.messageId);
	}
};

const email = [
	'yashrajpahwa@gmail.com',
	'kamaldeeppahwa@gmail.com',
	'updatedtechies@gmail.com',
];
const subject = 'test mail';
const message = 'this is a test mail';

const options = {
	email,
	subject,
	message,
};

sendMail(options);
