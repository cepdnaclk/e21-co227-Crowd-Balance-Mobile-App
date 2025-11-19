/**
 * OrganizerCrowdStatus.jsx
 * 
 * This screen allows event organizers to view and update the crowd status
 * of various locations in real-time. Organizers can see calculated crowd
 * levels based on user reports and can manually set the crowd level for each location.
 * 
 * Features:
 * - Fetch and display a list of locations with their current crowd status.
 * - Show calculated crowd scores based on user activity logs.
 * - Allow organizers to update the crowd level (Low, Moderate, High) for each location.
 * - Refresh control to reload the latest data. 
 * 
 *
 * functions:
 * - fetchLocations: Fetch the list of locations from the API.
 * - getTotalCrowdDataFromActivityLog: Calculate total crowd scores from activity logs.
 * - getCurrentCrowdLevel: Determine the current crowd level for a location.
 * - updateCrowdScore: Send updated crowd level to the API.
 * - confirmCrowdUpdate: Show confirmation alert before updating crowd level.
 * - formatTimeAgo: Format timestamps to show relative time (e.g., "5m ago").
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { API_BASE_URL } from "../../../config";

const OrganizerScreen = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Calculate total scores from entire activityLog
  const getTotalCrowdDataFromActivityLog = (activityLog) => {
    if (!activityLog || activityLog.length === 0) {
      return {
        minCrowdScore: 0,
        moderateCrowdScore: 0,
        maxCrowdScore: 0,
        total: 0,
      };
    }

    const counts = activityLog.reduce(
      (acc, activity) => { // acc: Accumulator
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

  // Get the current dominant crowd level based on calculated scores
  const getCurrentCrowdLevel = (location) => {
    // Use calculated scores from activityLog instead of database scores
    const calculatedScores = getTotalCrowdDataFromActivityLog(location.activityLog || []);
    const { minCrowdScore, moderateCrowdScore, maxCrowdScore } = calculatedScores;
    const total = minCrowdScore + moderateCrowdScore + maxCrowdScore;

    if (total === 0) return { level: "No Data", color: "#999", icon: "help" };

    if (maxCrowdScore >= moderateCrowdScore && maxCrowdScore >= minCrowdScore) {
      return { level: "High Crowd", color: "#F44336", icon: "trending-up" };
    } else if (moderateCrowdScore >= minCrowdScore) {
      return {
        level: "Moderate Crowd",
        color: "#FF9800",
        icon: "trending-flat",
      };
    } else {
      return { level: "Low Crowd", color: "#4CAF50", icon: "trending-down" };
    }
  };

  const fetchLocations = async () => {
    console.log("Fetching locations...");
    try {
      const response = await fetch(`${API_BASE_URL}/locations`);
      const result = await response.json();

      if (result.success) {
        // Filter out any potentially corrupted location data
        // Valid location object should have location idText, name and capacity
        const validLocations = result.data.filter(location => 
          location && location._id && location.name && location.capacity
        );
        setLocations(validLocations); // set locations to valid data only
        console.log(`Loaded ${validLocations.length} valid locations`);
      } else {
        Alert.alert("Error", "Failed to fetch locations");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
      console.log("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateCrowdScore = async (locationId, crowdLevel) => {
    console.log("Location id: " + locationId, "Crowd level: " + crowdLevel);

    try {
      // Update the crowd status
      const response = await fetch(
        `${API_BASE_URL}/locations/${locationId}/crowd`,
        {
          method: "PATCH", // only modify specific set of changes
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ crowdLevel }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success", `${crowdLevel} crowd level updated!`);
        fetchLocations(); // Refresh the list
      } else {
        Alert.alert("Error", result.message || "Failed to update crowd level");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
      console.log("Update error:", error);
    }
  };

  const confirmCrowdUpdate = (locationId, locationName, crowdLevel) => {
    const levelText =
      crowdLevel === "min"
        ? "Low"
        : crowdLevel === "moderate"
        ? "Moderate"
        : "High";

    Alert.alert(
      "Update Crowd Level",
      `Mark "${locationName}" as ${levelText} crowded?`, // Mark SmartCity as High crowded?
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => updateCrowdScore(locationId, crowdLevel),
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocations();
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m ago`;
  };

  const renderLocationItem = ({ item }) => {
    // Calculate scores from activityLog instead of using database scores
    const totalScores = getTotalCrowdDataFromActivityLog(item.activityLog || []);
    const currentLevel = getCurrentCrowdLevel(item);

    // Get the most recent activity for display
    const sortedActivities = (item.activityLog || []).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const mostRecentActivity = sortedActivities[0];

    return (
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationName}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: currentLevel.color },
            ]}
          >
            <Icon name={currentLevel.icon} size={14} color="white" />
            <Text style={styles.statusText}>{currentLevel.level}</Text>
          </View>
        </View>

        <Text style={styles.locationCapacity}>Capacity: {item.capacity}</Text>

        {/* Current Calculated Scores from Activity Log */}
        <View style={styles.scoresContainer}>
          <Text style={styles.scoresTitle}>
            Current Scores (From Activity Log):
          </Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreNumber, { color: "#4CAF50" }]}>
                {totalScores.minCrowdScore}
              </Text>
              <Text style={styles.scoreLabel}>Low</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreNumber, { color: "#FF9800" }]}>
                {totalScores.moderateCrowdScore}
              </Text>
              <Text style={styles.scoreLabel}>Moderate</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreNumber, { color: "#F44336" }]}>
                {totalScores.maxCrowdScore}
              </Text>
              <Text style={styles.scoreLabel}>High</Text>
            </View>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              Total Reports: {totalScores.total}
            </Text>
          </View>

          {/* Recent Activity Info */}
          {mostRecentActivity && (
            <View style={styles.lastUpdateContainer}>
              <Text style={styles.lastUpdateText}>
                Last update: {formatTimeAgo(mostRecentActivity.timestamp)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.crowdButton, styles.minButton]}
            onPress={() => confirmCrowdUpdate(item._id, item.name, "min")}
          >
            <Icon name="trending-down" size={20} color="white" />
            <Text style={styles.buttonText}>Low Crowd</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.crowdButton, styles.moderateButton]}
            onPress={() => confirmCrowdUpdate(item._id, item.name, "moderate")}
          >
            <Icon name="trending-flat" size={20} color="white" />
            <Text style={styles.buttonText}>Moderate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.crowdButton, styles.maxButton]}
            onPress={() => confirmCrowdUpdate(item._id, item.name, "max")}
          >
            <Icon name="trending-up" size={20} color="white" />
            <Text style={styles.buttonText}>High Crowd</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <Text style={styles.header}>Organizer Panel</Text>
        <Text style={styles.subtitle}>Update crowd levels in real-time</Text>
      </View>

      <FlatList
        data={locations} // An array of data to be rendered
        renderItem={renderLocationItem} // A function that takes one item from the data array and returns a React element to render
        keyExtractor={(item) => item._id} // A function that returns a unique key for each item.
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="location-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No locations available</Text>
            <Text style={styles.emptySubtext}>Add locations from the main panel</Text>
          </View>
        }
      />
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
    backgroundColor: "#007AFF",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  locationCard: {
    backgroundColor: "white",
    borderRadius: 12,
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
    marginBottom: 10,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  locationCapacity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  scoresContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  scoresTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  scoreItem: {
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scoreLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
    alignItems: "center",
  },
  totalText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  lastUpdateContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
    marginTop: 5,
  },
  lastUpdateText: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  crowdButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  minButton: {
    backgroundColor: "#4CAF50",
  },
  moderateButton: {
    backgroundColor: "#FF9800",
  },
  maxButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 5,
    textAlign: "center",
  },
});

export default OrganizerScreen;