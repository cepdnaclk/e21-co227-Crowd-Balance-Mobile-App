const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');

// Get notifications for a user
router.get('/user/:userId', notificationController.getUserNotifications);

// Create a new notification
router.post('/', notificationController.createNotification);

// Mark notification as read (delete it)
router.delete('/:notificationId', notificationController.deleteNotification);

// Clean up expired notifications (optional utility endpoint)
router.delete('/cleanup/expired', notificationController.cleanupExpiredNotifications);

module.exports = router;