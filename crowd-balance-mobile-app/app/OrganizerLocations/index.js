import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";
import { API_BASE_URL } from "../../config";

const OrganizerLocationScreen = () => {
  const [organizersByLocation, setOrganizersByLocation] = useState({});
  const [unassignedOrganizers, setUnassignedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [totalOrganizers, setTotalOrganizers] = useState(0);

  // Auto-refresh interval reference
  const intervalRef = useRef(null);

  // API URLs
  const ORGANIZERS_API = `${API_BASE_URL}/users/organizers`;
  const LOCATIONS_API = `${API_BASE_URL}/locations`;

  // Auto-refresh setup with cleanup (every 1 minute)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, 60000); // 60 seconds = 1 minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      console.log("Fetching organizers and locations data...");

      // Parallel API calls for better performance
      const [organizersResponse, locationsResponse] = await Promise.all([
        fetch(`${ORGANIZERS_API}`),
        fetch(LOCATIONS_API),
      ]);

      if (!organizersResponse.ok || !locationsResponse.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const [organizersResult, locationsResult] = await Promise.all([
        organizersResponse.json(),
        locationsResponse.json(),
      ]);

    //   console.log("Organizers API Response:", organizersResult);
    //   console.log("Locations API Response:", locationsResult);

      // Handle organizers data with better error handling
      let allOrganizers = [];
      if (organizersResult?.organizers) {
        allOrganizers = organizersResult.organizers;
      } else if (organizersResult?.success && organizersResult?.data) {
        allOrganizers = organizersResult.data;
      } else if (Array.isArray(organizersResult)) {
        allOrganizers = organizersResult;
      }

      // Handle locations data
      let allLocations = [];
      if (locationsResult?.success && locationsResult?.data) {
        allLocations = locationsResult.data;
      } else if (locationsResult?.locations) {
        allLocations = locationsResult.locations;
      } else if (Array.isArray(locationsResult)) {
        allLocations = locationsResult;
      }

      console.log(
        `Processed: ${allOrganizers.length} organizers, ${allLocations.length} locations`
      );

      // Filter only organizers
      const organizers = allOrganizers.filter(
        (user) => user?.userType === "Organizer"
      );

      setTotalOrganizers(organizers.length);

      // Group organizers by location
      const groupedOrganizers = {};
      const unassigned = [];

      organizers.forEach((organizer) => {
        if (!organizer?.assignedHall || organizer.assignedHall === "") {
          // Unassigned organizers
          unassigned.push(organizer);
        } else {
          // Find the location details
          const locationDetails = allLocations.find(
            (location) =>
              location?.name === organizer.assignedHall ||
              location?._id === organizer.assignedHall
          );

          const locationKey = organizer.assignedHall;

          if (!groupedOrganizers[locationKey]) {
            groupedOrganizers[locationKey] = {
              locationName: locationDetails?.name || organizer.assignedHall,
              locationId: locationDetails?._id || null,
              locationDetails: locationDetails || null,
              organizers: [],
            };
          }

          groupedOrganizers[locationKey].organizers.push(organizer);
        }
      });

      setOrganizersByLocation(groupedOrganizers);
      setUnassignedOrganizers(unassigned);
      setLastUpdated(new Date());
    } catch (error) {
      console.log("Error fetching data:", error);
      Alert.alert(
        "Error",
        "Failed to fetch organizer data. Please check your connection and try again.",
        [
          { text: "Retry", onPress: () => fetchData(showLoading) },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      available: "#4CAF50",
      assigned: "#FF9800",
      busy: "#F44336",
    };
    return statusColors[status?.toLowerCase()] || "#999";
  };

  const getCrowdLevelColor = (location) => {
    if (!location) return "#999";

    let crowdLevel = "";
    if (location.currentCrowdLevel) {
      crowdLevel = location.currentCrowdLevel.toLowerCase();
    } else if (location.crowdLevel) {
      crowdLevel = location.crowdLevel.toLowerCase();
    }

    const crowdColors = {
      min: "#4CAF50",
      low: "#4CAF50",
      moderate: "#FF9800",
      max: "#F44336",
      high: "#F44336",
    };

    return crowdColors[crowdLevel] || "#999";
  };

  const getCurrentCrowdLevel = (location) => {
    if (!location) return "Unknown";

    const crowdLevelMap = {
      min: "Low Crowd",
      low: "Low Crowd",
      moderate: "Moderate Crowd",
      max: "High Crowd",
      high: "High Crowd",
    };

    if (location.currentCrowdLevel) {
      return (
        crowdLevelMap[location.currentCrowdLevel.toLowerCase()] ||
        location.currentCrowdLevel
      );
    }

    if (location.crowdLevel) {
      return (
        crowdLevelMap[location.crowdLevel.toLowerCase()] || location.crowdLevel
      );
    }

    return "Unknown";
  };

  const handleHome = () => {
    router.push("../../dashboard");
  };

  const renderOrganizer = (organizer, index) => (
    <View key={organizer._id || index} style={styles.organizerCard}>
      <View style={styles.organizerHeader}>
        <View style={styles.organizerInfo}>
          <Text style={styles.organizerName}>
            {organizer.name || "Unknown"}
          </Text>
          <View style={styles.contactInfo}>
            <Icon name="phone" size={16} color="#666" />
            <Text style={styles.organizerPhone}>
              {organizer.phone || "No phone"}
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Icon name="email" size={16} color="#666" />
            <Text style={styles.organizerEmail}>
              {organizer.email || "No email"}
            </Text>
          </View>
        </View>
        <View style={styles.organizerActions}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(organizer.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {organizer.status || "Unknown"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderLocationSection = (locationKey, locationData) => (
    <View key={locationKey} style={styles.locationSection}>
      <View style={styles.locationHeader}>
        <View style={styles.locationTitleContainer}>
          <Icon name="location-on" size={24} color="#007AFF" />
          <Text style={styles.locationTitle}>
            {locationData.locationName}
          </Text>
        </View>
        <View style={styles.locationBadges}>
          {/* {locationData.locationDetails && (
            <View
              style={[
                styles.crowdBadge,
                {
                  backgroundColor: getCrowdLevelColor(
                    locationData.locationDetails
                  ),
                },
              ]}
            >
              <Text style={styles.crowdBadgeText}>
                {getCurrentCrowdLevel(locationData.locationDetails)}
              </Text>
            </View>
          )} */}
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {locationData.organizers.length}
            </Text>
          </View>
        </View>
      </View>

      {locationData.locationDetails && (
        <View style={styles.locationDetails}>
          {/* <Text style={styles.locationDetail}>
            ID: {locationData.locationDetails._id || "Unknown"}
          </Text> */}
          <Text style={styles.locationDetail}>
            Capacity:{" "}
            {locationData.locationDetails.capacity || "Unknown"} people
          </Text>
        </View>
      )}

      <View style={styles.organizersContainer}>
        {locationData.organizers.map((organizer, index) =>
          renderOrganizer(organizer, index)
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading organizer locations...</Text>
      </View>
    );
  }

  const locationKeys = Object.keys(organizersByLocation);
  const totalAssignedOrganizers = locationKeys.reduce(
    (total, key) => total + organizersByLocation[key].organizers.length,
    0
  );

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
        <Text style={styles.header}>Organizer Locations</Text>
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
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalOrganizers}</Text>
              <Text style={styles.statLabel}>Total Organizers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalAssignedOrganizers}</Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{unassignedOrganizers.length}</Text>
              <Text style={styles.statLabel}>Unassigned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{locationKeys.length}</Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>
          </View>
        </View>

        {/* Auto-refresh indicator */}
        <View style={styles.autoRefreshIndicator}>
          <Icon name="autorenew" size={16} color="#007AFF" />
          <Text style={styles.autoRefreshText}>
            Auto-refreshing every minute
          </Text>
          <Text style={styles.autoRefreshText}>
            • Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>

        {/* Assigned Organizers by Location */}
        {locationKeys.length > 0 ? (
          locationKeys.map((locationKey) =>
            renderLocationSection(locationKey, organizersByLocation[locationKey])
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="location-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No assigned organizers</Text>
            <Text style={styles.emptySubtext}>
              All organizers are currently unassigned
            </Text>
          </View>
        )}

        {/* Unassigned Organizers */}
        {unassignedOrganizers.length > 0 && (
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <View style={styles.locationTitleContainer}>
                <Icon name="person-off" size={24} color="#F44336" />
                <Text style={styles.locationTitle}>Unassigned Organizers</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {unassignedOrganizers.length}
                </Text>
              </View>
            </View>
            <Text style={styles.locationSubtitle}>
              Organizers not currently assigned to any location
            </Text>
            <View style={styles.organizersContainer}>
              {unassignedOrganizers.map((organizer, index) =>
                renderOrganizer(organizer, index)
              )}
            </View>
          </View>
        )}

        {/* Home Button */}
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  summaryStats: {
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
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  autoRefreshIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 15,
  },
  autoRefreshText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#007AFF",
  },
  locationSection: {
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
    marginBottom: 10,
  },
  locationTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  locationSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    marginTop: -5,
  },
  locationBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  crowdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  crowdBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  countBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  locationDetails: {
    marginBottom: 15,
    paddingLeft: 34,
  },
  locationDetail: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  organizersContainer: {
    gap: 10,
  },
  organizerCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 15,
    backgroundColor: "#fafafa",
  },
  organizerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  organizerPhone: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  organizerEmail: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  organizerActions: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
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
});

export default OrganizerLocationScreen;