import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import Chatbot from "../../components/Chatbot";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const HorizontalLine = () => (
  <View
    style={{
      borderBottomColor: "#ccc",
      borderBottomWidth: 1,
      marginVertical: 10,
      marginHorizontal: 5,
    }}
  />
);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missingReports, setMissingReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Image zoom modal states
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [chatVisible, setChatVisible] = useState(false);

  // Auto-refresh interval for notifications
  const notificationIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Safe async function wrapper to prevent Metro bundler issues
  const safeAsync = useCallback((asyncFn) => {
    return async (...args) => {
      try {
        if (!isMountedRef.current) return;
        return await asyncFn(...args);
      } catch (error) {
        if (!isMountedRef.current) return;
        console.log("Safe async error:", error);
        throw error;
      }
    };
  }, []);

  const fetchMissingReports = useCallback(
    safeAsync(async () => {
      if (isMountedRef.current) {
        setReportsLoading(true);
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/missing-reports/`, {
          timeout: 20000,
        });

        if (response.data && response.data.reports && isMountedRef.current) {
          setMissingReports(response.data.reports);
          console.log(
            "Fetched all missing reports:",
            response.data.reports.length
          );
        } else if (isMountedRef.current) {
          // Handle case where response doesn't contain reports
          setMissingReports([]);
        }
      } catch (error) {
        console.log("❌ No missing persons: ", error);
        // Set empty array on error to clear any stale data
        if (isMountedRef.current) {
          setMissingReports([]);
        }
      } finally {
        if (isMountedRef.current) {
          setReportsLoading(false);
        }
      }
    }),
    [safeAsync]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, []);

  // Add this to your useEffect hooks
  useEffect(() => {
    const reportsPollingInterval = setInterval(() => {
      if (isMountedRef.current) {
        fetchMissingReports();
      }
    }, 60000); // Refresh every 60 seconds

    return () => {
      clearInterval(reportsPollingInterval);
    };
  }, [fetchMissingReports]);

  const fetchUser = useCallback(
    safeAsync(async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");

        if (!userId || isLoggedIn !== "true") {
          console.log("No valid session found, redirecting to login");
          router.replace("/auth/login");
          return;
        }

        // First try to get user data from AsyncStorage
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          console.log("Loading user data from AsyncStorage");
          const userData = JSON.parse(storedUserData);
          if (isMountedRef.current) {
            setUser(userData);
            setLoading(false);
            fetchMissingReports();
            if (userData.userType === "Organizer") {
              fetchNotifications(userData.id || userId);
            }
          }
          return;
        }

        // Fallback: Fetch from server
        console.log("Fetching user data from server");
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
          timeout: 10000,
        });

        if (response.data && response.data.user && isMountedRef.current) {
          setUser(response.data.user);
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(response.data.user)
          );
          fetchMissingReports();
          if (response.data.user.userType === "Organizer") {
            fetchNotifications(response.data.user.id || userId);
          }
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error) {
        console.log("Error fetching user:", error);

        if (!isMountedRef.current) return;

        // Fallback to AsyncStorage data
        try {
          const userName = await AsyncStorage.getItem("userName");
          const userType = await AsyncStorage.getItem("userType");
          const userId = await AsyncStorage.getItem("userId");

          if (userName && userType) {
            console.log("Using fallback user data from AsyncStorage");
            const userData = { name: userName, userType: userType, id: userId };
            setUser(userData);
            fetchMissingReports();
            if (userType === "Organizer") {
              fetchNotifications(userId);
            }
          } else {
            await AsyncStorage.clear();
            router.replace("/auth/login");
          }
        } catch (fallbackError) {
          console.log("Fallback error:", fallbackError);
          console.log("*".repeat(50));
          await AsyncStorage.clear();
          router.replace("/auth/login");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }),
    [safeAsync]
  );

  const fetchNotifications = useCallback(
    safeAsync(async (userId, showLoading = true) => {
      if (!userId) {
        console.log("No userId provided for notifications");
        return;
      }

      if (showLoading && isMountedRef.current) {
        setNotificationsLoading(true);
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/notifications/user/${userId}`,
          {
            timeout: 10000,
          }
        );

        if (response.data && response.data.success && isMountedRef.current) {
          setNotifications(response.data.notifications || []);
          console.log(
            "Fetched notifications:",
            (response.data.notifications || []).length
          );
        }
      } catch (error) {
        console.log("Error fetching notifications:", error);

        // Handle specific error cases
        if (error.response && error.response.status === 404) {
          console.log(
            "Notifications endpoint not found - this might be expected if notifications feature is not implemented yet"
          );
          if (isMountedRef.current) {
            setNotifications([]);
          }
        } else if (error.code === "ECONNABORTED") {
          console.log("Notifications fetch timed out");
        }
        // Don't show alerts for auto-refresh errors
      } finally {
        if (showLoading && isMountedRef.current) {
          setNotificationsLoading(false);
        }
      }
    }),
    [safeAsync]
  );

  const handleDismissNotification = useCallback(
    safeAsync(async (notificationId) => {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/notifications/${notificationId}`,
          {
            timeout: 10000,
          }
        );

        if (response.data && response.data.success && isMountedRef.current) {
          setNotifications((prev) =>
            prev.filter((notification) => notification._id !== notificationId)
          );
          console.log("Notification dismissed successfully");
        }
      } catch (error) {
        console.log("Error dismissing notification:", error);
        if (isMountedRef.current) {
          Alert.alert(
            "Error",
            "Failed to dismiss notification. Please try again.",
            [{ text: "OK" }]
          );
        }
      }
    }),
    [safeAsync]
  );

  const handleMarkAsFound = useCallback((reportId, personName) => {
    Alert.alert(
      "Mark as Found",
      `Are you sure you want to mark ${personName} as found? This will permanently delete the report from the database.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Report",
          style: "destructive",
          onPress: () => deleteReport(reportId, personName),
        },
      ]
    );
  }, []);

  const deleteReport = useCallback(
    safeAsync(async (reportId, personName) => {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/missing-reports/${reportId}`,
          { timeout: 10000 }
        );

        if (response.status === 200 && isMountedRef.current) {
          setMissingReports((prev) =>
            prev.filter((report) => report._id !== reportId)
          );

          Alert.alert(
            "Success",
            `${personName} has been marked as found and the report has been deleted.`,
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.log("Error deleting report:", error);

        if (!isMountedRef.current) return;

        let errorMessage = "Failed to delete the report. Please try again.";
        if (error.response) {
          errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
          errorMessage = "Network error. Please check your connection.";
        }

        Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      }
    }),
    [safeAsync]
  );

  // Image zoom functions
  const openImageModal = useCallback((imageUri) => {
    setSelectedImageUri(imageUri);
    setImageModalVisible(true);
    setImageLoading(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModalVisible(false);
    setSelectedImageUri(null);
    setImageLoading(false);
  }, []);

  const onRefresh = useCallback(
    safeAsync(async () => {
      setRefreshing(true);

      // Clear current data before fetching
      setMissingReports([]);

      try {
        await fetchMissingReports();

        if (user && user.userType === "Organizer") {
          const userId = user.id || user._id;
          await fetchNotifications(userId, false);
        }
      } catch (error) {
        console.log("Error during refresh:", error);
      } finally {
        if (isMountedRef.current) {
          setRefreshing(false);
        }
      }
    }),
    [safeAsync, fetchMissingReports, fetchNotifications, user]
  );

  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (error) {
      console.log("Error formatting date:", error);
      return "Invalid Date";
    }
  }, []);

  const getStatusStyle = useCallback((status) => {
    switch (status) {
      case "Active":
        return { backgroundColor: "#ef4444", color: "white" };
      case "Found":
        return { backgroundColor: "#10b981", color: "white" };
      case "Closed":
        return { backgroundColor: "#6b7280", color: "white" };
      default:
        return { backgroundColor: "#ef4444", color: "white" };
    }
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            router.replace("/auth/LoginScreen");
          } catch (error) {
            console.log("Error during logout:", error);
            router.replace("/auth/LoginScreen");
          }
        },
      },
    ]);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Setup auto-refresh for notifications
  useEffect(() => {
    if (user && user.userType === "Organizer") {
      const userId = user.id || user._id;

      if (userId) {
        // Set up auto-refresh
        notificationIntervalRef.current = setInterval(() => {
          if (isMountedRef.current) {
            fetchNotifications(userId, false);
          }
        }, 30000); // Every 30 seconds
      }
    }

    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, [user, fetchNotifications]);

  const handleOpenChat = useCallback(() => {
    setChatVisible(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatVisible(false);
  }, []);

  // Notification Banner Component
  const NotificationBanner = useCallback(({ notification, onDismiss }) => {
    const getNotificationColors = (type) => {
      switch (type) {
        case "assignment":
          return { backgroundColor: "#3b82f6", borderColor: "#1d4ed8" };
        case "urgent":
          return { backgroundColor: "#ef4444", borderColor: "#dc2626" };
        default:
          return { backgroundColor: "#10b981", borderColor: "#059669" };
      }
    };

    const getNotificationIcon = (type) => {
      switch (type) {
        case "assignment":
          return "📍";
        case "urgent":
          return "🚨";
        default:
          return "📢";
      }
    };

    const colors = getNotificationColors(notification.type);
    const icon = getNotificationIcon(notification.type);

    const getTimeRemaining = () => {
      try {
        const now = new Date();
        const expiresAt = new Date(notification.expiresAt);
        const diffMs = expiresAt - now;

        if (diffMs <= 0) return "Expired";

        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

        if (diffMins > 0) {
          return `${diffMins}m ${diffSecs}s remaining`;
        } else {
          return `${diffSecs}s remaining`;
        }
      } catch (error) {
        console.log("Error calculating time remaining:", error);
        return "Time unavailable";
      }
    };

    return (
      <View
        style={[
          styles.notificationContainer,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: colors.borderColor,
          },
        ]}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleRow}>
            <Text style={styles.notificationIcon}>{icon}</Text>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => onDismiss(notification._id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.notificationContent}>{notification.content}</Text>

        <View style={styles.notificationFooter}>
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
  }, []);

  const handleReportMissing = useCallback(() => {
    router.push("/GetLostInfo");
  }, []);

  const handleCrowdStatusNavigation = useCallback(() => {
    if (user?.userType === "Organizer") {
      router.push("/crowdStatus/OrganizerCrowdStatus");
    } else if (user?.userType === "Panel") {
      router.push("/crowdStatus/MainPanelCrowdStatus");
    } else {
      Alert.alert(
        "Access Denied",
        "Your user type does not have access to crowd status features.",
        [{ text: "OK" }]
      );
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading user data</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user.name} 👋</Text>
          <Text style={styles.subtitle}>Role: {user.userType}</Text>
          {user.userType === "Organizer" && user.assignedHall && (
            <Text style={styles.hallInfo}>Hall: {user.assignedHall}</Text>
          )}
        </View>

        {/* Notifications Section - Only for Organizers */}
        {user.userType === "Organizer" && (
          <View style={styles.notificationsSection}>
            {notificationsLoading ? (
              <View style={styles.notificationsLoading}>
                <ActivityIndicator size="small" color="#1e40af" />
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            ) : notifications.length > 0 ? (
              <>
                <Text style={styles.notificationsSectionTitle}>
                  Notifications ({notifications.length})
                </Text>
                {notifications.map((notification) => (
                  <NotificationBanner
                    key={notification._id}
                    notification={notification}
                    onDismiss={handleDismissNotification}
                  />
                ))}
              </>
            ) : null}
          </View>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleReportMissing}
          >
            <Text style={styles.emergencyButtonText}>
              🚨 Report Missing Person
            </Text>
          </TouchableOpacity>
        </View>

        {/* Missing Reports Section */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Missing Person Reports</Text>
            <Text style={styles.reportCount}>({missingReports.length})</Text>
          </View>

          {reportsLoading ? (
            <View style={styles.reportsLoading}>
              <ActivityIndicator size="small" color="#1e40af" />
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : missingReports.length === 0 ? (
            <View style={styles.noReports}>
              <Text style={styles.noReportsIcon}>📄</Text>
              <Text style={styles.noReportsText}>No missing persons</Text>
              <Text style={styles.noReportsSubtext}>
                No missing person reports have been filed yet
              </Text>
            </View>
          ) : (
            <View style={styles.reportsList}>
              {missingReports.map((report) => (
                <View key={report._id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <TouchableOpacity
                      onPress={() => openImageModal(report.image)}
                      style={styles.imageContainer}
                    >
                      <Image
                        source={{ uri: report.image }}
                        style={styles.reportImage}
                        onError={(e) =>
                          console.log(
                            "Image loading error:",
                            e.nativeEvent.error
                          )
                        }
                      />
                      <View style={styles.zoomIndicator}>
                        <Text style={styles.zoomIcon}>🔍</Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportName}>{report.name}</Text>
                      <Text style={styles.reportDetails}>
                        Age: {report.age} • {report.gender}
                      </Text>
                      <Text style={styles.reportLocation}>
                        📍 {report.lastseenlocation}
                      </Text>
                      <Text style={styles.reportDate}>
                        Reported: {formatDate(report.createdAt)}
                      </Text>
                      {report.UserId && (
                        <Text style={styles.reportedBy}>
                          Reported by: {report.UserId.name || "Unknown"}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        getStatusStyle(report.status),
                      ]}
                    >
                      <Text style={styles.statusText}>{report.status}</Text>
                    </View>
                  </View>

                  {report.description && report.description.length > 0 && (
                    <View style={styles.reportDescription}>
                      <Text style={styles.descriptionLabel}>Description:</Text>
                      {report.description.map((desc, index) => (
                        <Text key={index} style={styles.descriptionText}>
                          • {desc}
                        </Text>
                      ))}
                    </View>
                  )}

                  {report.status !== "Found" && (
                    <View style={styles.actionButtonContainer}>
                      <TouchableOpacity
                        style={styles.foundButton}
                        onPress={() =>
                          handleMarkAsFound(report._id, report.name)
                        }
                      >
                        <Text style={styles.foundButtonText}>
                          ✓ PERSON FOUND
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          
          <HorizontalLine />

          <TouchableOpacity
            style={styles.button}
            onPress={handleCrowdStatusNavigation}
          >
            <Text style={styles.buttonText}>Crowd Status</Text>
          </TouchableOpacity>

          <HorizontalLine />

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/CarParks')}
          >
            <Text style={styles.buttonText}>Car Parks</Text>
          </TouchableOpacity>

          {user?.userType === 'Panel' && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/CarParksAdmin')}
            >
              <Text style={styles.buttonText}>Car Parks (Admin)</Text>
            </TouchableOpacity>
          )}

          <HorizontalLine />

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/SchoolDataScreen")}
          >
            <Text style={styles.buttonText}>School Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/OrganizerLocations")}
          >
            <Text style={styles.buttonText}>Organizer Locations</Text>
          </TouchableOpacity>

          <View
            style={{
              borderBottomColor: "#ccc",
              borderBottomWidth: 1,
              marginVertical: 10,
              marginHorizontal: 5,
            }}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.buttonText}>View Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Chat Button - Shows when chat is closed */}
      {!chatVisible && (
        <TouchableOpacity
          style={styles.floatingChatButton}
          onPress={handleOpenChat}
        >
          <Text style={styles.floatingChatButtonText}>💬</Text>
        </TouchableOpacity>
      )}

      {/* Fullscreen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <StatusBar hidden={true} />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeImageModal}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {imageLoading && (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.imageLoadingText}>Loading image...</Text>
            </View>
          )}

          {selectedImageUri && (
            <TouchableOpacity
              style={styles.imageModalContainer}
              activeOpacity={1}
              onPress={closeImageModal}
            >
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  Alert.alert("Error", "Failed to load image");
                }}
              />
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Chatbot Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseChat}
      >
        <Chatbot onClose={handleCloseChat} userId={user?.id || user?._id} />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 20,
  },
  header: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginTop: 30,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 8,
  },
  hallInfo: {
    fontSize: 16,
    color: "#1e40af",
    fontWeight: "600",
  },
  notificationsSection: {
    marginBottom: 20,
  },
  notificationsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  notificationsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  notificationContainer: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  dismissButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  dismissText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  notificationContent: {
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 22,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontStyle: "italic",
  },
  okButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  okButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: "#1e40af",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emergencyButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  reportsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  reportCount: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 8,
  },
  reportsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noReports: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noReportsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noReportsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  noReportsSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  reportImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  zoomIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomIcon: {
    fontSize: 10,
    color: "white",
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  reportDetails: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  reportLocation: {
    fontSize: 14,
    color: "#1e40af",
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  reportedBy: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  reportDescription: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  actionButtonContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  foundButton: {
    backgroundColor: "#10b981",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  foundButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonContainer: {
    gap: 15,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    backgroundColor: "#1e40af",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  imageLoadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
    zIndex: 1,
  },
  imageLoadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  imageModalContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight,
    maxWidth: screenWidth,
    maxHeight: screenHeight,
  },
  floatingChatButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 999,
  },
  floatingChatButtonText: {
    fontSize: 28,
  },
});

export default Dashboard;
