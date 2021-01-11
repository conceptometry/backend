const ErrorResponse = require('./errorResponse');

const advancedResultsFindBy = async (
	model,
	find,
	req,
	res,
	next,
	populate,
	populate1,
	populate2
) => {
	let query;

	// Copy req.query
	const reqQuery = { ...req.query };

	// Fields to exclude
	const removeFields = [
		'select',
		'sort',
		'page',
		'limit',
		'occured',
		'cancelled',
	];

	// Loop over removeFields and delete them from reqQuery
	removeFields.forEach((param) => delete reqQuery[param]);

	// Create query string
	let queryStr = JSON.stringify(reqQuery);

	// Create operators ($gt, $gte, etc)
	queryStr = queryStr.replace(
		/\b(gt|gte|lt|lte|in)\b/g,
		(match) => `$${match}`
	);

	// Finding resource

	const qs = ',' + queryStr.split('{')[1];
	const findquery = JSON.stringify(find).split('}')[0];
	let fq;
	if (qs.length > 2) {
		fq = `${findquery} ${qs}`;
	} else {
		fq = `${findquery}}`;
	}
	const pfq = JSON.parse(fq);
	query = model.find(pfq);

	// Select Fields
	if (req.query.select) {
		const fields = req.query.select.split(',').join(' ');
		query = query.select(fields);
	}

	// Sort
	if (req.query.sort) {
		const sortBy = req.query.sort.split(',').join(' ');
		query = query.sort(sortBy);
	} else {
		query = query.sort('-createdAt');
	}

	// Pagination
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 10;
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;
	const total = await model.countDocuments(pfq);
	let pages;

	if (limit > total) {
		pages = 1;
	} else {
		pages = Math.ceil(total / limit);
	}

	query = query.skip(startIndex).limit(limit);

	if (populate) {
		query = query.populate(populate);
	}
	if (populate && populate1) {
		query = query.populate(populate).populate(populate1);
	}
	if (populate && populate1 && populate2) {
		query = query.populate(populate).populate(populate1).populate(populate2);
	}

	// Executing query
	const results = await query;

	// Pagination result
	const pagination = {};

	if (endIndex < total) {
		pagination.next = {
			page: page + 1,
			limit,
		};
	} else {
		pagination.next = null;
	}

	if (startIndex > 0) {
		pagination.prev = {
			page: page - 1,
			limit,
		};
	} else {
		pagination.prev = null;
	}

	res.status(200).json({
		success: true,
		count: results.length,
		pagination,
		pages,
		message: results,
	});
};

module.exports = advancedResultsFindBy;
