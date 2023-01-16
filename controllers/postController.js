const catchAsync = require('../helpers/catchAsync');
const Post = require('./../model/postModel');
const factory = require('./handlerFactory');

// exports.setTourAndUserIds = (req, res, next) => {
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user._id;
//   next();
// };
exports.GetAll = factory.getAll(Post);
exports.Create = factory.createOne(Post);
exports.deletePost = factory.deleteOne(Post);
exports.updatePost = factory.updateOne(Post);
exports.GetOnePost = factory.getOne(Post);
