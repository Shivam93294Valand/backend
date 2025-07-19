const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', auth, notificationController.getNotifications);
router.put('/', auth, notificationController.markAllAsRead);

module.exports = router; 