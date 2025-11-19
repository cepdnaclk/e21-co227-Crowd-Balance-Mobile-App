/**
 * LocationDetails.jsx
 * 
 * This component displays detailed information about a specific location,
 * including its crowd status, recent activity feed, assigned organizers,
 * and provides functionalities to clear activity reports and unassign organizers.
 * 
 * functions:
 * - fetchLocationDetails: Fetches location details, activities, and assigned organizers from the backend.
 * - handleClearActivities: Clears all activity reports for the location.
 * - handleUnassignOrganizer: Unassigns an organizer from the location.
 * - renderClearModal: Renders a confirmation modal for clearing activities.
 * - renderUnassignModal: Renders a confirmation modal for unassigning an organizer.
 * 
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "../../../config";

const LocationDetail = () => {
  const params = useLocalSearchParams();
  const [location, setLocation] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizers, setOrganizers] = useState([]);

  const [clearingActivities, setClearingActivities] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // New states for unassign functionality
  const [unassigningOrganizer, setUnassigningOrganizer] = useState(null);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);

  const fetchLocationDetails = useCallback(async (locationId) => {
    if (!locationId) return;

    try {
      // Fetch updated location data
      const locationResponse = await fetch(`${API_BASE_URL}/locations`);
      const locationResult = await locationResponse.json();

      if (locationResult.success) {
        const updatedLocation = locationResult.data.find(
          (loc) => loc._id === locationId
        );
        if (updatedLocation) {
          setLocation((prevLocation) => {
            if (
              JSON.stringify(prevLocation) !== JSON.stringify(updatedLocation)
            ) {
              return updatedLocation;
            }
            return prevLocation;
          });
        }
      }

      // Fetch recent activities
      const activitiesResponse = await fetch(
        `${API_BASE_URL}/locations/${locationId}/activities`
      );
      const activitiesResult = await activitiesResponse.json();

      if (activitiesResult.success) {
        setActivities(activitiesResult.data.activities || []);
      }

      // Fetch assigned organizers for this location
      const organizersResponse = await fetch(
        `${API_BASE_URL}/locations/${locationId}/organizers`
      );
      const organizersResult = await organizersResponse.json();

      if (organizersResult.success) {
        setOrganizers(organizersResult.data.organizers || []);
      }
    } catch (error) {
      console.log("Error fetching location details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Parse the location data from params
    const parsedLocation = params.locationData
      ? JSON.parse(params.locationData)
      : null;
    if (parsedLocation) {
      setLocation(parsedLocation);
      fetchLocationDetails(parsedLocation._id);
    } else {
      setLoading(false);
    }
  }, [params.locationData, fetchLocationDetails]);

  // Calculate total crowd data from all activities
  const getTotalCrowdData = () => {
    if (!activities || activities.length === 0) {
      return {
        minCrowdScore: 0,
        moderateCrowdScore: 0,
        maxCrowdScore: 0,
        total: 0,
      };
    }

    const counts = activities.reduce(
      (acc, activity) => {
        switch (activity.crowdLevel) {
          case "min":
            acc.minCrowdScore += 1;
            break;
          case "moderate":
            acc.moderateCrowdScore += 1;
            break;
          case "max":
            acc.maxCrowdScore += 1;
            break;
        }
        return acc;
      },
      { minCrowdScore: 0, moderateCrowdScore: 0, maxCrowdScore: 0 }
    );

    return {
      ...counts,
      total:
        counts.minCrowdScore + counts.moderateCrowdScore + counts.maxCrowdScore,
    };
  };

  const onRefresh = () => {
    if (location?._id) {
      setRefreshing(true);
      fetchLocationDetails(location._id);
    }
  };

  const handleClearActivities = async () => {
    if (activities.length === 0) {
      Alert.alert("No Activities", "There are no activity reports to clear.");
      return;
    }
    console.log("..................1");

    setClearingActivities(true);
    setShowClearModal(false);
    console.log("..................2");
    try {
      // In your frontend, before making the request
      console.log("Clearing activities for locationId:", location._id);
      const response = await fetch(
        `${API_BASE_URL}/locations/${location._id}/activities`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("..................3");
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers])
      );

      const result = await response.json();

      console.log("..................4");
      console.log("result.success: " + result.success);

      if (result.success) {
        Alert.alert("Success", result.message);
        // Refresh the data
        fetchLocationDetails(location._id);
      } else {
        Alert.alert("Error", result.message || "Failed to clear activities");
      }
    } catch (error) {
      console.log("❌ Error clearing activities:", error);
      Alert.alert("Error", "Network error occurred while clearing activities");
    } finally {
      setClearingActivities(false);
    }
  };

  // New function to handle unassigning organizers
  const handleUnassignOrganizer = async () => {
    if (!selectedOrganizer) return;

    setUnassigningOrganizer(selectedOrganizer._id);
    setShowUnassignModal(false);

    try {
      console.log(
        "Unassigning organizer:",
        selectedOrganizer._id,
        "from location:",
        location._id
      );

      // Update the organizer's assignedHall field to empty string
      const response = await fetch(
        `${API_BASE_URL}/users/organizers/${selectedOrganizer._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedHall: "",
            // status: "Available" // Uncomment if you want to also change status
          }),
        }
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.log("Non-JSON response:", textResponse);
        throw new Error(
          "Server returned non-JSON response. Please check server status."
        );
      }

      const result = await response.json();
      console.log("Unassign response:", result);

      if (result.organizer || result.success) {
        Alert.alert(
          "Success",
          `${selectedOrganizer.name || "Organizer"} has been unassigned from ${
            location.name
          }`
        );
        // Refresh the data to update organizers list
        fetchLocationDetails(location._id);
      } else {
        throw new Error(result.message || "Unassignment failed");
      }
    } catch (error) {
      console.log("❌ Error unassigning organizer:", error);

      let errorMessage = "Failed to unassign organizer. Please try again.";

      if (error.name === "SyntaxError" && error.message.includes("JSON")) {
        errorMessage =
          "Server error: Unable to process the request. Please check if the server is running properly.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setUnassigningOrganizer(null);
      setSelectedOrganizer(null);
    }
  };

  // Function to show unassign confirmation
  const showUnassignConfirmation = (organizer) => {
    setSelectedOrganizer(organizer);
    setShowUnassignModal(true);
  };

  const renderClearModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showClearModal}
      onRequestClose={() => setShowClearModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Icon name="warning" size={32} color="#F44336" />
            <Text style={styles.modalTitle}>Clear Activity Feed</Text>
          </View>

          <Text style={styles.modalMessage}>
            Are you sure you want to clear all {activities.length} activity
            reports for {location?.name}?
          </Text>

          <Text style={styles.modalWarning}>This action cannot be undone.</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowClearModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleClearActivities}
            >
              <Text style={styles.confirmButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // New modal for unassign confirmation
  const renderUnassignModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showUnassignModal}
      onRequestClose={() => setShowUnassignModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Icon name="person-remove" size={32} color="#FF9800" />
            <Text style={styles.modalTitle}>Unassign Organizer</Text>
          </View>

          <Text style={styles.modalMessage}>
            Are you sure you want to unassign{" "}
            <Text style={styles.boldText}>
              {selectedOrganizer?.name || "this organizer"}
            </Text>{" "}
            from <Text style={styles.boldText}>{location?.name}</Text>?
          </Text>

          <Text style={styles.modalWarning}>
            They will be marked as available and can be assigned to other
            locations.
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowUnassignModal(false);
                setSelectedOrganizer(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.unassignButton]}
              onPress={handleUnassignOrganizer}
              disabled={unassigningOrganizer === selectedOrganizer?._id}
            >
              {unassigningOrganizer === selectedOrganizer?._id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.unassignButtonText}>Unassign</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: Location data not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getCrowdLevel = (crowdData) => {
    const { minCrowdScore, moderateCrowdScore, maxCrowdScore, total } =
      crowdData;

    if (total === 0) return { level: "No Data", color: "#999", percentage: 0 };

    if (maxCrowdScore >= moderateCrowdScore && maxCrowdScore >= minCrowdScore) {
      return {
        level: "High Crowd",
        color: "#F44336",
        percentage: Math.round((maxCrowdScore / total) * 100),
      };
    } else if (moderateCrowdScore >= minCrowdScore) {
      return {
        level: "Moderate Crowd",
        color: "#FF9800",
        percentage: Math.round((moderateCrowdScore / total) * 100),
      };
    } else {
      return {
        level: "Low Crowd",
        color: "#4CAF50",
        percentage: Math.round((minCrowdScore / total) * 100),
      };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m ago`;
  };

  const getCrowdLevelConfig = (crowdLevel) => {
    switch (crowdLevel) {
      case "min":
        return {
          label: "Low Crowd",
          color: "#4CAF50",
          icon: "trending-down",
          bgColor: "#E8F5E8",
        };
      case "moderate":
        return {
          label: "Moderate Crowd",
          color: "#FF9800",
          icon: "trending-flat",
          bgColor: "#FFF3E0",
        };
      case "max":
        return {
          label: "High Crowd",
          color: "#F44336",
          icon: "trending-up",
          bgColor: "#FFEBEE",
        };
      default:
        return {
          label: "Unknown",
          color: "#999",
          icon: "help",
          bgColor: "#F5F5F5",
        };
    }
  };

  const renderCrowdChart = (crowdData) => {
    const { minCrowdScore, moderateCrowdScore, maxCrowdScore, total } =
      crowdData;

    if (total === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No crowd data available</Text>
        </View>
      );
    }

    const minPercentage = (minCrowdScore / total) * 100;
    const moderatePercentage = (moderateCrowdScore / total) * 100;
    const maxPercentage = (maxCrowdScore / total) * 100;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBar}>
          <View
            style={[
              styles.chartSegment,
              {
                width: `${minPercentage}%`,
                backgroundColor: "#4CAF50",
              },
            ]}
          />
          <View
            style={[
              styles.chartSegment,
              {
                width: `${moderatePercentage}%`,
                backgroundColor: "#FF9800",
              },
            ]}
          />
          <View
            style={[
              styles.chartSegment,
              {
                width: `${maxPercentage}%`,
                backgroundColor: "#F44336",
              },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderActivityFeed = () => {
    if (activities.length === 0) {
      return (
        <View style={styles.noActivityContainer}>
          <Icon name="schedule" size={48} color="#ccc" />
          <Text style={styles.noActivityText}>No activity reports</Text>
          <Text style={styles.noActivitySubtext}>
            Organizers haven't updated crowd levels yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.activityList}>
        {activities.map((activity, index) => {
          const config = getCrowdLevelConfig(activity.crowdLevel);
          return (
            <View key={index} style={styles.activityItem}>
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: config.bgColor },
                ]}
              >
                <Icon name={config.icon} size={20} color={config.color} />
              </View>

              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  Crowd level updated to{" "}
                  <Text style={{ color: config.color, fontWeight: "bold" }}>
                    {config.label}
                  </Text>
                </Text>
                <Text style={styles.activityTime}>
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Updated renderAssignedOrganizers with unassign functionality
  const renderAssignedOrganizers = () => {
    if (organizers.length === 0) {
      return (
        <View style={styles.noOrganizersContainer}>
          <Icon name="group" size={48} color="#ccc" />
          <Text style={styles.noOrganizersText}>No organizers assigned</Text>
          <Text style={styles.noOrganizersSubtext}>
            Assign organizers to help manage this location
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.organizersList}>
        {organizers.map((organizer, index) => (
          <View key={index} style={styles.organizerItem}>
            <View style={styles.organizerIcon}>
              <Icon name="person" size={24} color="#007AFF" />
            </View>
            <View style={styles.organizerContent}>
              <Text style={styles.organizerName}>
                {organizer.name || `Organizer ${index + 1}`}
              </Text>
              <Text style={styles.organizerInfo}>Email: {organizer.email}</Text>
              <Text style={styles.organizerInfo}>
                Phone: {organizer.phone || "N/A"}
              </Text>
            </View>
            {/* Unassign button */}
            <TouchableOpacity
              style={styles.unassignIconButton}
              onPress={() => showUnassignConfirmation(organizer)}
              disabled={unassigningOrganizer === organizer._id}
            >
              {unassigningOrganizer === organizer._id ? (
                <ActivityIndicator size="small" color="#FF9800" />
              ) : (
                <Icon name="person-remove" size={20} color="#FF9800" />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  // Get total data instead of last hour data
  const totalData = getTotalCrowdData();
  const crowdInfo = getCrowdLevel(totalData);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading location details...</Text>
      </View>
    );
  }

  const handleAssignOrganizers = () => {
    router.push({
      pathname: "./AssignOrganizers",
      params: {
        crowdLevel: crowdInfo.level,
        locationId: location._id,
        locationName: location.name,
        locationCapacity: location.capacity.toString(),
      },
    });
  };

  const handleHome = () => {
    router.push("../dashboard");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.header}>Location Details</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Location Info Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationName}>{location.name}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: crowdInfo.color }]}
            >
              <Text style={styles.statusText}>{crowdInfo.level}</Text>
            </View>
          </View>

          <Text style={styles.locationCapacity}>
            Capacity: {location.capacity} people
          </Text>
        </View>

        {/* Live Activity Feed */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Icon name="update" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Activity Feed</Text>
            {activities.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setShowClearModal(true)}
                disabled={clearingActivities}
              >
                {clearingActivities ? (
                  <ActivityIndicator size="small" color="#F44336" />
                ) : (
                  <Icon name="clear-all" size={18} color="#F44336" />
                )}
                <Text style={styles.clearButtonText}>
                  {clearingActivities ? "Clearing..." : "Clear Feed"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {renderActivityFeed()}
        </View>

        {/* Crowd Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Crowd Statistics</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalData.total}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{location.capacity}</Text>
              <Text style={styles.statLabel}>Max Capacity</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: crowdInfo.color }]}>
                {crowdInfo.percentage}%
              </Text>
              <Text style={styles.statLabel}>Dominant Level</Text>
            </View>
          </View>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Crowd Level Analysis</Text>
          {renderCrowdChart(totalData)}
        </View>

        {/* Individual Score Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>Detailed Breakdown</Text>

          <View style={styles.scoreItem}>
            <View style={styles.scoreHeader}>
              <View
                style={[styles.scoreIndicator, { backgroundColor: "#4CAF50" }]}
              />
              <Text style={styles.scoreTitle}>Low Crowd Reports</Text>
            </View>
            <Text style={styles.scoreValue}>{totalData.minCrowdScore}</Text>
          </View>

          <View style={styles.scoreItem}>
            <View style={styles.scoreHeader}>
              <View
                style={[styles.scoreIndicator, { backgroundColor: "#FF9800" }]}
              />
              <Text style={styles.scoreTitle}>Moderate Crowd Reports</Text>
            </View>
            <Text style={styles.scoreValue}>
              {totalData.moderateCrowdScore}
            </Text>
          </View>

          <View style={styles.scoreItem}>
            <View style={styles.scoreHeader}>
              <View
                style={[styles.scoreIndicator, { backgroundColor: "#F44336" }]}
              />
              <Text style={styles.scoreTitle}>High Crowd Reports</Text>
            </View>
            <Text style={styles.scoreValue}>{totalData.maxCrowdScore}</Text>
          </View>
        </View>

        {/* Assigned Organizers Card */}
        <View style={styles.organizersCard}>
          <View style={styles.organizersHeader}>
            <Icon name="group" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Assigned Organizers</Text>
            <View style={styles.organizersCount}>
              <Text style={styles.countText}>{organizers.length}</Text>
            </View>
          </View>
          {renderAssignedOrganizers()}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.assignButton]}
            onPress={handleAssignOrganizers}
          >
            <Icon
              name="person-add"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Assign Organizers</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.homeButton]}
            onPress={handleHome}
          >
            <Icon
              name="home"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Modals */}
      {renderClearModal()}
      {renderUnassignModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    marginBottom: 20,
    textAlign: "center",
  },
  headerContainer: {
    marginTop: 0,
    paddingTop: 30,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    marginRight: 15,
  },
  refreshButton: {
    marginLeft: 15,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  locationCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  locationName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  locationCapacity: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  locationId: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
  // Activity Feed Styles
  activityCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  activityList: {
    marginTop: 10,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: "#666",
  },
  noActivityContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noActivityText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  noActivitySubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  // Existing styles continue...
  statsCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  breakdownCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  chartContainer: {
    marginTop: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  chartBar: {
    flexDirection: "row",
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 15,
  },
  chartSegment: {
    height: "100%",
  },
  chartLegend: {
    marginBottom: 15,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: "#666",
  },
  percentageContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  percentageText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  percentageValue: {
    fontWeight: "bold",
  },
  noDataText: {
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    fontSize: 14,
  },
  scoreItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  scoreTitle: {
    fontSize: 14,
    color: "#333",
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  buttonContainer: {
    marginBottom: 35,
    gap: 15,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  button: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  assignButton: {
    backgroundColor: "#1e40af",
  },
  homeButton: {
    backgroundColor: "#059669",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Organizers Styles
  organizersCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  organizersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  organizersCount: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  countText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  organizersList: {
    marginTop: 10,
  },
  organizerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  organizerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  organizerContent: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  organizerInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  noOrganizersContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noOrganizersText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  noOrganizersSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  // New Unassign Button Styles
  unassignIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE0B2",
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    margin: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: 14,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 25,
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
  },
  modalButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  confirmButton: {
    backgroundColor: "#F44336",
  },
  // New Unassign Modal Button Style
  unassignButton: {
    backgroundColor: "#FF9800",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  // New Unassign Modal Button Text Style
  unassignButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  // Clear Button Styles (update existing activityHeader)
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  clearButtonText: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "600",
    marginLeft: 4,
  },
  // Additional styles for modal text formatting
  boldText: {
    fontWeight: "bold",
  },
});

export default LocationDetail;
