const mongoose = require('mongoose');
const Tour = require('./tourModel');

const postSchema = mongoose.Schema({
  title: { type: String, required: [true, 'title Required'], trim: true },
  picture: { type: String, required: [true, 'Picture Required'], trim: true },
  content: { type: String, required: [true, 'Content Required'] },
  tags: { type: Object, required: [true, 'Tags Required'] },
  comments: [
    {
      author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A comment required a User ID'],
      },
      comment: { type: String, required: [true, 'comment  required'] },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  likes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  shortDescription: { type: String, required: [true, 'Short description Required'] },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A Post required a User ID'],
  },
});

// postSchema.index({ tour: 1, user: 1 }, { unique: true });

postSchema.pre(/^find/, function (next) {
  // this.populate('tour user');
  // populate({
  //   path: 'tour',
  //   select: 'name',
  // })
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// reviewSchema.statics.CalculateAverageRatings = async function (tourId) {
//   const stats = await this.aggregate([
//     {
//       $match: { tour: tourId },
//     },
//     {
//       $group: {
//         _id: '$tour',
//         nRating: { $sum: 1 },
//         avgRating: { $avg: '$rating' },
//       },
//     },
//   ]);

//   console.log(stats);
//   if (stats.length > 0) {
//     await Tour.findByIdAndUpdate(tourId, {
//       ratingsQuantity: stats[0].nRating,
//       ratingsAverage: stats[0].avgRating,
//     });
//   } else {
//     await Tour.findByIdAndUpdate(tourId, {
//       ratingsQuantity: 0,
//       ratingsAverage: 4.5,
//     });
//   }
// };

//post dont hace next function
// reviewSchema.post('save', function () {
//   //this.constructor call thid current model
//   this.constructor.CalculateAverageRatings(this.tour);
// });

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   next();
// });

// reviewSchema.post(/^findOneAnd/, function () {
//   //await this.findOne() : DOES NOT beacause at this point the query has already executed
//   this.r.constructor.CalculateAverageRatings(this.r.tour);
// });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
