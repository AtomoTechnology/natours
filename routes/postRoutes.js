const express = require('express');
const authController = require('./../controllers/authController');
const postController = require('./../controllers/postController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);
// router.use(authController.protect);

router.route('/').get(postController.GetAll).post(authController.restrictTo('admin'), postController.Create);

router
  .route('/:id')
  .get(postController.GetOnePost)
  .patch(authController.restrictTo('admin'), postController.updatePost)
  .delete(authController.restrictTo('admin'), postController.deletePost);

// router.post('/:id/comments').postController.addComment

module.exports = router;
