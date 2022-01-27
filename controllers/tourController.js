const catchAsync = require('./../helpers/catchAsync');
const factory = require('./handlerFactory');
const Tour = require('../model/tourModel');
const AppError = require('../helpers/AppError');
const multer = require('multer');
const sharp = require('sharp');
// const fs = require('fs');
// const APIFeatures = require('../helpers/ApiFeatures');
// const AppError = require('../helpers/AppError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('It nt a image please upload only image.', 400), false);
  }
};

exports.resizeTourPhoto = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //upload cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //upload images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourPhoto = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.setQueryString = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,description,duration';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.updateOneTour = factory.updateOne(Tour);
exports.deleteOneTour = factory.deleteOne(Tour);
exports.getOneTour = factory.getOne(Tour, { path: 'reviews' });

exports.getStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        duration: { $gte: 5 },
      },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        totalRatings: { $sum: '$ratingsQuantity' },
      },
    },
    {
      $sort: {
        _id: 1,
        maxPrice: -1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

exports.getPlanMonthly = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  console.log(year);
  const plans = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: { $gte: new Date(`${year}-01-01`) },
        startDates: { $lte: new Date(`${year}-12-31`) },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTours: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { plans },
  });
});

// tours-within/:distance/center/:latLng/unit/:unit
exports.getTourWithIn = catchAsync(async (req, res, next) => {
  const { distance, latLng, unit } = req.params;
  const [lat, lng] = latLng.split(',');
  if (!lat || !lng) return next(new AppError('Please provide a longitude and a latitude in the format lat,long', 400));
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

  res.status(200).json({
    status: 'success',
    data: {
      data: tours,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { distance, latLng, unit } = req.params;
  const [lat, lng] = latLng.split(',');
  if (!lat || !lng) return next(new AppError('Please provide a longitude and a latitude in the format lat,long', 400));
  console.log(lat, lng);
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: 0.001,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

//getting tours from files
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//checking ID
// exports.checkId = (req, res, next, val) => {
//   if (val >= tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Tour not found',
//     });
//   }
//   next();
// };

// exports.middlewareCheckBodyFields = (req, res, next) => {
//   console.log(req.body.name, req.body.price);
//   if (!req.body.name || !req.body.price) {
//     return res.status(404).json({
//       status: 'failed',
//       message: 'name and/or price are requiered!!!',
//     });
//   }
//   next();
// };
