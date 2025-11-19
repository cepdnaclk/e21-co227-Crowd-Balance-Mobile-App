const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat endpoints
router.post('/chat', chatController.sendMessage);
router.get('/chat/health', chatController.healthCheck);

module.exports = router;