const Notification = require('../model/NotificationModel');

// Get notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notifications = await Notification.find({
      userId: userId,
      expiresAt: { $gt: new Date() } // Only get non-expired notifications
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { userId, title, content, type = 'general' } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and content are required'
      });
    }

    const notification = new Notification({
      userId,
      title,
      content,
      type
    });

    await notification.save();

    res.json({
      success: true,
      notification: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

// Mark notification as read (delete it)
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Clean up expired notifications (optional utility endpoint)
const cleanupExpiredNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lte: new Date() }
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'Expired notifications cleaned up'
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup notifications'
    });
  }
};

module.exports = {
  getUserNotifications,
  createNotification,
  deleteNotification,
  cleanupExpiredNotifications
};