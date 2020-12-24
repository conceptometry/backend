const student = [
	{ id: 1, name: 'Jon' },
	{ id: 2, name: 'Dave' },
	{ id: 3, name: 'Joe' },
], 

//remove item with id=2
const idToBeRemoved = 2;

student.splice(
	student.findIndex((a) => a.id === idToBeRemoved),
	1
);

//print result
console.log(student);
