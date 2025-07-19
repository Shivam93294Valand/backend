const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { body } = require('express-validator');

// Get current user
router.get('/me', auth, userController.getMe);

// Follow/Unfollow routes
router.post('/follow/:id', auth, userController.followUser);
router.get('/followers', auth, userController.getFollowers);
router.get('/following', auth, userController.getFollowing);

// Block/Unblock user
router.post('/block/:id', auth, userController.blockUser);

// Get user by ID
router.get('/:id', auth, userController.getUserById);

// Update profile
router.put('/me', [
  auth,
  body('bio').optional().trim().isLength({ max: 500 }),
  body('avatar').optional().isURL()
], userController.updateProfile);

module.exports = router;
