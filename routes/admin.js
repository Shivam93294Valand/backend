const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const adminController = require('../controllers/adminController');

// Apply auth middleware first
router.use(auth);
// Then admin check
router.use(admin);

router.get('/users', adminController.getAllUsers);
router.get('/reports', adminController.getReports);
router.post('/ban/:id', adminController.banUser);
router.delete('/content/:id', adminController.removeContent);

module.exports = router;