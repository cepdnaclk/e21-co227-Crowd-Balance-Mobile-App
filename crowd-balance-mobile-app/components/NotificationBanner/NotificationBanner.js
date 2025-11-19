// components/NotificationBanner.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const NotificationBanner = ({ notification, onDismiss }) => {
  const getNotificationColors = (type) => {
    switch (type) {
      case 'assignment':
        return {
          backgroundColor: '#3b82f6',
          borderColor: '#1d4ed8',
          iconColor: '#ffffff'
        };
      case 'urgent':
        return {
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          iconColor: '#ffffff'
        };
      default:
        return {
          backgroundColor: '#10b981',
          borderColor: '#059669',
          iconColor: '#ffffff'
        };
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return '📍';
      case 'urgent':
        return '🚨';
      default:
        return '📢';
    }
  };

  const colors = getNotificationColors(notification.type);
  const icon = getNotificationIcon(notification.type);

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const expiresAt = new Date(notification.expiresAt);
    const diffMs = expiresAt - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s remaining`;
    } else {
      return `${diffSecs}s remaining`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.title}>{notification.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => onDismiss(notification._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.content}>{notification.content}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.timeText}>{getTimeRemaining()}</Text>
        <TouchableOpacity
          style={styles.okButton}
          onPress={() => onDismiss(notification._id)}
        >
          <Text style={styles.okButtonText}>Okay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  okButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  okButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default NotificationBanner;