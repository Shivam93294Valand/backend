const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');

router.post('/signup', [
  body('username').trim().isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], authController.signup);

router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], authController.login);

module.exports = router;