const moment = require('moment');

// const dateEntered = '9-12-2021';
// const timeEnteredFrom = '22:00';
// const from = `${dateEntered}, ${timeEnteredFrom}`;

// const date = from.split(', ')[0];
// const time = from.split(', ')[1];
// if (!time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
// 	console.log('Invalid time');
// }
// if (
// 	!date.match(/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/)
// ) {
// 	console.log('Invalid date');
// } else {
// 	if (moment(from, 'DD/MM/YYYY, HH:mm') < moment()) {
// 		console.log(`Past date entered`);
// 	} else {
// 		const dateObj = moment(from, 'DD/MM/YYYY, HH:mm').toISOString();
// 		console.log(dateObj);
// 	}
// }

// const timeEnteredTo = '2:00';
// const to = `${dateEntered}, ${timeEnteredTo}`;
// const dateTill = to.split(', ')[0];
// const timeTill = to.split(', ')[1];
// if (!timeTill.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
// 	console.log('Invalid time');
// }
// if (
// 	!dateTill.match(
// 		/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/
// 	)
// ) {
// 	console.log('Invalid date');
// } else {
// 	if (moment(to, 'DD/MM/YYYY, HH:mm') < moment()) {
// 		console.log(`Past date entered`);
// 	} else {
// 		const dateObj = moment(to, 'DD/MM/YYYY, HH:mm').toISOString();
// 		console.log(dateObj);
// 	}
// }

if (moment() > moment('2020-12-10T18:29:59.000Z')) {
	console.log(true);
}
