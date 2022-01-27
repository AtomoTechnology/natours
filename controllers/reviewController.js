const catchAsync = require('../helpers/catchAsync');
const Review = require('./../model/reviewModel');
const factory = require('./handlerFactory');

exports.setTourAndUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};
exports.GetAll = factory.getAll(Review);
exports.Create = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.GetOneReview = factory.getOne(Review);
