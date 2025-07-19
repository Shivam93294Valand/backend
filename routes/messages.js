const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const messageController = require('../controllers/messageController');

router.post('/', auth, messageController.sendMessage);
router.get('/:userId', auth, messageController.getMessagesWithUser);
router.get('/', auth, messageController.getAllConversations);

module.exports = router; 