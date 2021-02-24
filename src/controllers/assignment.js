const Assignment = require('../models/assignment');
const User = require('../models/user');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const advancedResultsFindBy = require('../utils/advancedResultsFindBy');
const path = require('path');
const moment = require('moment');
const aws = require('aws-sdk');

// @desc   Get all assignments
// @route  GET /api/v1/assignments
// @access Private
exports.getAssignments = asyncHandler(async (req, res, next) => {
  let findBy;
  if (req.user.role === 'teacher') {
    findBy = { byUser: req.user._id };
  }
  if (req.user.role === 'student') {
    findBy = { student: req.user._id };
  }
  // Do a query
  advancedResultsFindBy(Assignment, findBy, req, res, next);
});

// @desc   Get specific assignment by id
// @route  GET /api/v1/assignments/:id
// @access Private
exports.getAssignment = asyncHandler(async (req, res, next) => {
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    const { id } = req.params;
    const assignment = await Assignment.findById(id)
      .populate({
        path: 'byUser',
        select: 'name',
      })
      .populate({ path: 'student', select: 'name' })
      .select(fields);
    if (!assignment) {
      return next(
        new ErrorResponse(`The assignment with id ${id} does not exist`, 404)
      );
    } else {
      return res.status(200).json({
        success: true,
        message: assignment,
      });
    }
  } else {
    const { id } = req.params;
    const assignment = await Assignment.findById(id)
      .populate({
        path: 'byUser',
        select: 'name',
      })
      .populate({ path: 'student', select: 'name' });
    if (!assignment) {
      return next(
        new ErrorResponse(`The assignment with id ${id} does not exist`, 404)
      );
    } else {
      return res.status(200).json({
        success: true,
        message: assignment,
      });
    }
  }
});

// @desc   Create new assignment
// @route  POST /api/v1/assignments
// @access Private (teacher)
exports.createAssignment = asyncHandler(async (req, res, next) => {
  if (!req.body.dueDate) {
    return next(
      new ErrorResponse(`Please enter due date (number of days)`, 400)
    );
  }
  if (req.body.dueDate < 1) {
    return next(new ErrorResponse(`Please enter a valid due date`, 400));
  }
  if (
    !req.body.student ||
    req.body.student.length < 1 ||
    req.body.student.length === 0 ||
    req.body.student === []
  ) {
    return next(new ErrorResponse(`Please enter the assigned students`, 400));
  }

  req.body.student.map(async (s) => {
    const student = await User.findById(s);
    if (!student) {
      return next(new ErrorResponse(`No student found with id ${s}`));
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(student);
    }
    if (student.teacher.toString() !== req.user.id) {
      return next(
        new ErrorResponse(`Student with id ${s} is not your student`)
      );
    }
  });

  //Set Due Date
  const d = new Date();
  let dueDate = d.setDate(d.getDate() + parseInt(req.body.dueDate));
  dueDate = d.setHours(23, 59, 59, 0);

  // Set predefined values
  req.body.byUser = req.user._id;
  req.body.dueDate = dueDate;

  // Create new Assignment
  const assignment = await Assignment.create(req.body);

  // Give back response
  res.status(201).json({
    success: true,
    message: 'A new assignment has been created',
    data: assignment,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(moment(assignment.dueDate).format('HH:mm:ss'));
    console.log(moment(assignment.dueDate).format('DD-MM-YY'));
  }
});

// @desc   Update assignment
// @route  PUT /api/v1/assignments/:id
// @access Private (teacher)
exports.updateAssignment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const assignment = await Assignment.findById(id);
  if (assignment.byUser.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Only the owner has access to update assignment`, 400)
    );
  }
  if (req.body.student) {
    return next(new ErrorResponse(`You cannot update the students`, 403));
  } else if (req.body.dueDate) {
    //Set Due Date
    const d = new Date();
    let dueDate = d.setDate(d.getDate() + parseInt(req.body.dueDate));
    dueDate = d.setHours(23, 59, 59, 0);
    req.body.dueDate = dueDate;
  }

  const updatedAssignment = await Assignment.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    message: updatedAssignment,
  });
});

// @desc   Delete assignment
// @route  DELETE /api/v1/assignments/:id
// @access Private (teacher)
exports.deleteAssignment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const findAssignment = await Assignment.findById(id);
  if (!findAssignment) {
    return next(new ErrorResponse(`No assignment found`, 404));
  }
  if (findAssignment.byUser.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Only the owner has access to delete assignment`, 400)
    );
  }
  const assignment = await Assignment.findByIdAndDelete(id);
  res.status(200).json({
    success: true,
    message: `Assignment has been deleted`,
  });
});

// @desc   Upload teacher material of assignment
// @route  PUT /api/v1/assignments/:id/teacher/upload
// @access Private (teacher)
exports.uploadTeacherMaterial = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (assignment.byUser.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `Only the owner has access to update materials of the assignment`,
        400
      )
    );
  }
  if (!assignment) {
    return next(
      new ErrorResponse(`Assignment not found with ID of ${req.params.id}`, 404)
    );
  }
  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }
  const file = req.files.file;
  // check file type
  if (!file.mimetype.startsWith('application/pdf')) {
    return next(new ErrorResponse(`Please upload a pdf file`, 400));
  }
  // check file size
  const fileSizeInMB = Math.round(process.env.TEACHER_MAX_FILE_SIZE / 1000000);
  if (file.size > process.env.TEACHER_MAX_FILE_SIZE) {
    return next(
      new ErrorResponse(
        `Please upload a file smaller than ${fileSizeInMB} MB`,
        400
      )
    );
  }

  // rename file
  file.name = `${assignment._id}${path.parse(file.name).ext}`;

  aws.config.update({
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPACES_ACCESS_KEY,
  });

  const spacesEndpoint = new aws.Endpoint(process.env.SPACES_ENDPOINT);
  const s3 = new aws.S3({
    endpoint: spacesEndpoint,
  });
  const blob = req.files.file.data;
  const params = {
    Bucket: process.env.SPACES_NAME,
    Key: `uploads/assignment-materials/${file.name}`,
    Body: blob,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  s3.upload(params, async function (err, data) {
    if (err) {
      console.log(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(data);
      }
      const url = data.Location;
      const filePath = `${
        url.split('digitaloceanspaces.com')[0]
      }cdn.digitaloceanspaces.com${url.split('digitaloceanspaces.com')[1]}`;
      await Assignment.findByIdAndUpdate(req.params.id, {
        teacherMaterials: filePath,
      });
      res.status(200).json({
        success: true,
        message: `Uploaded ${file.name}`,
      });
    }
  });

  // file.mv(
  //   `${process.env.TEACHER_ASSIGNMENT_MATERIALS_UPLOAD_PATH}/${file.name}`,
  //   async (err) => {
  //     if (err) {
  //       console.log(err);
  //       return next(new ErrorResponse(`Problem with file upload`, 500));
  //     }

  //     await Assignment.findByIdAndUpdate(req.params.id, {
  //       teacherMaterials: `${req.protocol}://${req.get(
  //         'host'
  //       )}/uploads/teacher/assignments/${file.name}`,
  //     });
  //     res.status(200).json({
  //       success: true,
  //       message: `Uploaded ${file.name}`,
  //     });
  //   }
  // );
});
