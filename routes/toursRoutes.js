const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const reviewsRouter = require('./reviewRoutes');
const router = require('./reviewRoutes');

const toursRouter = express.Router();

//middleware for params that
// toursRouter.param('idTour', function (req, res, next, val) {
//   console.log('Value ID : ', val);
//   next();
// });
// toursRouter.param('idTour', tourController.checkId);

//multiply params with optional param
// toursRouter.get('/:idTour/:x/:y?', (req, res) => {
//   const idTour = req.params;
// });

// toursRouter
//   .route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'), reviewController.Create);

toursRouter.use('/:tourId/reviews', reviewsRouter);

toursRouter.get('/stats', tourController.getStats);
toursRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getPlanMonthly
  );
toursRouter.route('/top-5-tours').get(tourController.setQueryString, tourController.getAllTours);
toursRouter.get('/:id', tourController.getOneTour);

toursRouter.route('/tours-within/:distance/center/:latLng/unit/:unit').get(tourController.getTourWithIn);
toursRouter.route('/distances/:latLng/unit/:unit').get(tourController.getDistance);

toursRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);
toursRouter.patch(
  '/:id',
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.uploadTourPhoto,
  tourController.resizeTourPhoto,
  tourController.updateOneTour
);
toursRouter.delete(
  '/:id',
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.deleteOneTour
);

module.exports = toursRouter;
