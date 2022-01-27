const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: [40, 'A tour name must have less or iqual then 40 characters '],
      minlength: [10, 'A tour name must have more then 10 characters '],
      // validate: [validator.isAlpha, 'Atour name must only content character'],
    },
    duration: { type: Number, required: [true, 'A duration is required'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A dificulty is required'],
      enum: {
        values: ['easy', 'medium', 'difficulty'],
        message: 'A difficuty must be easy medium or difficulty',
      },
    },
    price: { type: Number, required: [true, 'The price is required'] },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'a rating must be above 1.0'],
      max: [5, 'a rating must be below 5.1'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this[the current document] works when you creating a new document not for updating
          return val < this.price;
        },
        message: 'Discound price ({VALUE}) should be less than th real price',
      },
    },
    summary: { type: String, trim: true },
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    description: {
      type: String,
      trim: true,
      required: [true, 'The description is required'],
    },
    imageCover: {
      type: String,
      trim: true,
      required: [true, 'The image cover is required'],
    },
    images: [String],
    slug: String,
    secret: { type: Boolean, default: false },
    createdAt: { type: Date, trim: true, default: Date.now() },
    startDates: [Date],
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//defined indexes
toursSchema.index({ price: 1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' });

//virtual properties
toursSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENTS MIDDLEWARE (TRIGGER) RUN BEFORE .SAVE() , .CREATE()
toursSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

toursSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});

//QUERY MIDDLEWARE

toursSchema.pre(/^find/, function (next) {
  this.find({ secret: { $ne: true } });
  this.start = Date.now();
  next();
});
toursSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

toursSchema.post(/^find/, function (docs, next) {
  console.log('the research takes ', Date.now() - this.start, ' milessecond');
  next();
});

//agregation middleware
// toursSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secret: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const tours = mongoose.model('Tour', toursSchema);

module.exports = tours;
