const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/multer');
const uploadController = require('../controllers/uploadController');

router.post('/', auth, upload.single('file'), uploadController.uploadFile);

module.exports = router; 