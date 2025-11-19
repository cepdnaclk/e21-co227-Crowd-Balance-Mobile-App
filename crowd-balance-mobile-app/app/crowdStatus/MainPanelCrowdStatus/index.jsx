/**
 * Main Panel Crowd Status Screen
 * Displays a list of locations with their crowd status and activities.
 * Allows adding new locations and deleting existing ones.
 * 
 * 
 * functions:
 * - fetchLocations: Fetches the list of locations and their activities from the backend.
 * - addNewLocation: Adds a new location to the backend.
 * - deleteLocation: Deletes a location from the backend.
 * - handleLocationPress: Navigates to the detailed view of a location.
 * - getCrowdLevel: Determines the crowd level based on activity reports.
 * - renderCrowdChart: Renders a visual chart of crowd activity levels.
 * - renderLocationItem: Renders each location item in the list.
 * - onRefresh: Handles pull-to-refresh action.
 * - Auto-refresh: Automatically refreshes the data every 60 seconds.
 * 
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";
import { API_BASE_URL } from "../../../config";

const MainPanelScreen = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCapacity, setNewLocationCapacity] = useState("");
  const [deleting, setDeleting] = useState(null); // Track which location is being deleted
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchLocations(false);

    // Set up auto-refresh every 60 seconds
    refreshIntervalRef.current = setInterval(() => {
      console.log("Auto-refreshing locations data...");
      fetchLocations(true);
    }, 60000); // 60 seconds

    // Clean up interval on component unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchLocations = async (isAutoRefresh = false) => {
    try {
      // Don't show loading indicator for auto-refresh to avoid UI flickering
      if (!isAutoRefresh) {
        setLoading(true);
      }

      const response = await fetch(`${API_BASE_URL}/locations`);
      const result = await response.json();

      if (result.success) {
        // Process each location to get activities
        const locationsWithActivities = await Promise.all(
          result.data.map(async (location) => {
            try {
              const activitiesResponse = await fetch(
                `${API_BASE_URL}/locations/${location._id}/activities`
              );
              const activitiesResult = await activitiesResponse.json();

              if (activitiesResult.success) {
                const activities = activitiesResult.data.activities || [];

                // Sort activities by timestamp (newest first)
                const sortedActivities = activities.sort(
                  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                );

                return {
                  ...location, // spread existing location properties 
                  activities: sortedActivities, // add sorted activities 
                };
              }

              return {
                ...location,
                activities: [],
              };
            } catch (error) {
              console.log(
                `Error fetching activities for ${location.name}:`,
                error
              );
              return {
                ...location,
                activities: [],
              };
            }
          })
        );

        setLocations(locationsWithActivities);
        setLastUpdated(new Date());

        // Log auto-refresh success (optional)
        if (isAutoRefresh) {
          console.log("Locations auto-refreshed successfully");
        }
      } else {
        // Only show alert for manual refreshes, not auto-refreshes
        if (!isAutoRefresh) {
          Alert.alert("Error", "Failed to fetch locations");
        }
      }
    } catch (error) {
      // Only show alert for manual refreshes, not auto-refreshes
      if (!isAutoRefresh) {
        Alert.alert("Error", "Network error occurred");
      } else {
        console.log("Auto-refresh error:", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const addNewLocation = async () => {
    if (!newLocationName.trim() || !newLocationCapacity.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (
      isNaN(parseInt(newLocationCapacity)) ||
      parseInt(newLocationCapacity) < 1
    ) {
      Alert.alert("Error", "Capacity must be a valid number greater than 0");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newLocationName.trim(),
          capacity: parseInt(newLocationCapacity),
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success", "Location added successfully!");
        setModalVisible(false);
        setNewLocationName("");
        setNewLocationCapacity("");
        fetchLocations(); // Refresh the list
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
    }
  };

  const deleteLocation = async (locationId, locationName) => {
    Alert.alert(
      "Delete Location",
      `Are you sure you want to delete "${locationName}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(locationId); // Show loading state for this location

              const response = await fetch(
                `${API_BASE_URL}/locations/${locationId}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const result = await response.json();

              if (result.success) {
                Alert.alert("Success", "Location deleted successfully!");
                fetchLocations(); // Refresh the list to remove deleted location
              } else {
                Alert.alert(
                  "Error",
                  result.message || "Failed to delete location"
                );
              }
            } catch (error) {
              console.log("Delete error:", error);
              Alert.alert("Error", "Network error occurred while deleting");
            } finally {
              setDeleting(null); // Clear loading state
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocations(false);
  };

  const handleLocationPress = (item) => {
    console.log("Handling Navigation...");
    try {
      // Fixed navigation for Expo Router
      console.log("Trying Handling Navigation...");

      router.push({
        pathname: "./LocationDetails",
        params: {
          locationData: JSON.stringify({
            _id: item._id,
            name: item.name,
            capacity: item.capacity,
            minCrowdScore: item.minCrowdScore,
            moderateCrowdScore: item.moderateCrowdScore,
            maxCrowdScore: item.maxCrowdScore,
          }),
        },
      });
    } catch (error) {
      console.log("Navigation error:", error);
      Alert.alert("Error", "Unable to navigate to location details");
    }
  };

  const getCrowdLevel = (location) => {
    const totalActivities = location.activities.length;

    if (totalActivities === 0) {
      return { level: "No Data", color: "#999", percentage: 0 };
    }

    // Count crowd levels from all activities
    const crowdCounts = location.activities.reduce(
      (acc, activity) => {
        if (activity.crowdLevel === "min") acc.min++;
        else if (activity.crowdLevel === "moderate") acc.moderate++;
        else if (activity.crowdLevel === "max") acc.max++;
        return acc;
      },
      { min: 0, moderate: 0, max: 0 }
    );

    if (
      crowdCounts.max >= crowdCounts.moderate &&
      crowdCounts.max >= crowdCounts.min
    ) {
      return {
        level: "High Crowd",
        color: "#F44336",
        percentage: Math.round((crowdCounts.max / totalActivities) * 100),
      };
    } else if (crowdCounts.moderate >= crowdCounts.min) {
      return {
        level: "Moderate Crowd",
        color: "#FF9800",
        percentage: Math.round((crowdCounts.moderate / totalActivities) * 100),
      };
    } else {
      return {
        level: "Low Crowd",
        color: "#4CAF50",
        percentage: Math.round((crowdCounts.min / totalActivities) * 100),
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

  const renderCrowdChart = (location) => {
    const totalActivities = location.activities.length;

    if (totalActivities === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No activity reports yet</Text>
          <Text style={styles.noDataSubtext}>
            Waiting for crowd level reports...
          </Text>
        </View>
      );
    }

    // Count crowd levels from all activities
    const crowdCounts = location.activities.reduce(
      (acc, activity) => {
        if (activity.crowdLevel === "min") acc.min++;
        else if (activity.crowdLevel === "moderate") acc.moderate++;
        else if (activity.crowdLevel === "max") acc.max++;
        return acc;
      },
      { min: 0, moderate: 0, max: 0 }
    );

    const minPercentage = (crowdCounts.min / totalActivities) * 100;
    const moderatePercentage = (crowdCounts.moderate / totalActivities) * 100;
    const maxPercentage = (crowdCounts.max / totalActivities) * 100;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          Activity Summary ({totalActivities} reports)
        </Text>

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

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#4CAF50" }]}
            />
            <Text style={styles.legendText}>Low ({crowdCounts.min})</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF9800" }]}
            />
            <Text style={styles.legendText}>
              Moderate ({crowdCounts.moderate})
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#F44336" }]}
            />
            <Text style={styles.legendText}>High ({crowdCounts.max})</Text>
          </View>
        </View>

        {/* Show most recent update time */}
        {location.activities.length > 0 && (
          <View style={styles.lastUpdateContainer}>
            <Text style={styles.lastUpdateText}>
              Last update: {formatTimeAgo(location.activities[0].timestamp)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderLocationItem = ({ item }) => {
    const crowdInfo = getCrowdLevel(item);
    const totalReports = item.activities.length;
    const isDeleting = deleting === item._id;

    return (
      <TouchableOpacity
        style={[styles.locationCard, isDeleting && styles.deletingCard]}
        onPress={() => handleLocationPress(item)}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <View style={styles.locationHeader}>
          <Text style={styles.locationName}>{item.name}</Text>
          <View style={styles.rightSection}>
            <View
              style={[styles.statusBadge, { backgroundColor: crowdInfo.color }]}
            >
              <Text style={styles.statusText}>{crowdInfo.level}</Text>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deletingButton]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent navigation when delete is pressed
                deleteLocation(item._id, item.name);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icon name="delete" size={20} color="white" />
              )}
            </TouchableOpacity>

            <Icon
              name="chevron-right"
              size={24}
              color="#ccc"
              style={styles.chevronIcon}
            />
          </View>
        </View>

        <Text style={styles.locationCapacity}>
          Capacity: {item.capacity} people
        </Text>

        {renderCrowdChart(item)}

        <View style={styles.totalReports}>
          <Text style={styles.totalReportsText}>
            Total Reports: {totalReports}
          </Text>
          <Text style={styles.tapHint}>Tap to view detailed analytics</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.header}>Live Crowd Monitoring</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={locations}
        renderItem={renderLocationItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add Location Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Location</Text>

            <TextInput
              style={styles.input}
              placeholder="Location Name"
              placeholderTextColor="#837f7fff"
              value={newLocationName}
              onChangeText={setNewLocationName}
            />

            <TextInput
              style={styles.input}
              placeholder="Capacity"
              placeholderTextColor="#837f7fff"
              value={newLocationCapacity}
              onChangeText={setNewLocationCapacity}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewLocationName("");
                  setNewLocationCapacity("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addLocationButton]}
                onPress={addNewLocation}
              >
                <Text style={styles.addButtonText}>Add Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerContainer: {
    paddingTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  addButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
  },
  listContainer: {
    padding: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  locationCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deletingCard: {
    opacity: 0.6,
    backgroundColor: "#f0f0f0",
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#F44336",
    borderRadius: 15,
    padding: 6,
    marginRight: 8,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  deletingButton: {
    backgroundColor: "#999",
  },
  chevronIcon: {
    marginLeft: 5,
  },
  locationCapacity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  chartContainer: {
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  chartBar: {
    flexDirection: "row",
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },
  chartSegment: {
    height: "100%",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 11,
    color: "#666",
  },
  lastUpdateContainer: {
    backgroundColor: "#f0f8ff",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  lastUpdateText: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "bold",
  },
  noDataText: {
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    fontSize: 14,
    marginBottom: 4,
  },
  noDataSubtext: {
    textAlign: "center",
    color: "#ccc",
    fontSize: 12,
  },
  totalReports: {
    backgroundColor: "#f8f8f8",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  totalReportsText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  tapHint: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    fontStyle: "italic",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  addLocationButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
});

export default MainPanelScreen;