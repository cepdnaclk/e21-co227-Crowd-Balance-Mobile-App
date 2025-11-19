/**
 * AssignOrganizers.jsx
 * 
 * This component allows admin users to assign available organizers to locations
 * with low crowd levels. It fetches organizer and location data from the API,
 * filters available organizers and those assigned to low crowd locations,
 * and provides UI for assignment and unassignment of organizers.
 * 
 * 
 * functions:
 * - fetchData: Fetches organizers and locations data from the API.
 * - checkIfLocationHasLowCrowd: Determines if a location has low crowd level.
 * - getCurrentCrowdLevel: Retrieves the current crowd level of a location.
 * - handleAssignOrganizer: Initiates the assignment of an organizer.
 * 
 */


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
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import * as SMS from "expo-sms";
import { API_BASE_URL } from "../../../config";

const AssignOrganizers = () => {
  const params = useLocalSearchParams();
  const [availableOrganizers, setAvailableOrganizers] = useState([]);
  const [assignedOrganizers, setAssignedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh interval reference
  const intervalRef = useRef(null);

  // API Base URLs - Consider moving to config/constants
  const ORGANIZERS_API = `${API_BASE_URL}/users/organizers`;
  const LOCATIONS_API = `${API_BASE_URL}/locations`;

  // Location details from params
  const locationId = params.locationId;
  const locationName = params.locationName;
  const crowdLevel = params.crowdLevel;
  const locationCapacity = params.locationCapacity;

  // Auto-refresh setup with cleanup
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, 10000);

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

      // console.log("Organizers API Response:", organizersResult);
      // console.log("Locations API Response:", locationsResult);

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

      // Filter Available Organizers with improved validation
      const availableOrganizersList = allOrganizers.filter((organizer) => {
        const isOrganizer = organizer?.userType === "Organizer";
        const isAvailable = organizer?.status === "Available";
        const isNotAssigned =
          !organizer?.assignedHall || organizer.assignedHall === "";

        return isOrganizer && isAvailable && isNotAssigned;
      });

      // Filter Organizers in Low Crowd Areas with better logic
      const assignedOrganizersList = [];

      allOrganizers.forEach((organizer) => {
        if (
          organizer?.assignedHall &&
          organizer.assignedHall !== "" &&
          organizer?.status !== "Busy" &&
          organizer?.userType === "Organizer"
        ) {
          const assignedLocation = allLocations.find(
            (location) =>
              location?.name === organizer.assignedHall ||
              location?._id === organizer.assignedHall ||
              location?.assignedOrganizers?.some(
                (assignedOrg) => assignedOrg?._id === organizer._id
              )
          );

          if (
            assignedLocation &&
            checkIfLocationHasLowCrowd(assignedLocation)
          ) {
            assignedOrganizersList.push({
              ...organizer,
              assignedLocation: assignedLocation.name,
              assignedLocationId: assignedLocation._id,
              currentCrowdLevel: getCurrentCrowdLevel(assignedLocation),
            });
          }
        }
      });

      setAvailableOrganizers(availableOrganizersList);
      setAssignedOrganizers(assignedOrganizersList);
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

  // Enhanced crowd level checking with multiple fallbacks
  const checkIfLocationHasLowCrowd = (location) => {
    if (!location) return false;

    // Priority 1: Direct currentCrowdLevel field
    if (location.currentCrowdLevel) {
      const level = location.currentCrowdLevel.toLowerCase();
      return level === "low crowd" || level === "min" || level === "low";
    }

    // Priority 2: Legacy crowdLevel field
    if (location.crowdLevel) {
      const level = location.crowdLevel.toLowerCase();
      return level === "min" || level === "low crowd" || level === "low";
    }

    // Priority 3: Recent activities analysis
    if (location.activities?.length > 0) {
      const recentActivities = location.activities.slice(-10);
      const lowCrowdCount = recentActivities.filter(
        (activity) =>
          activity?.crowdLevel?.toLowerCase() === "min" ||
          activity?.crowdLevel?.toLowerCase() === "low"
      ).length;
      return lowCrowdCount > recentActivities.length * 0.6; // 60% threshold
    }

    // Priority 4: Crowd scores calculation
    const {
      minCrowdScore = 0,
      moderateCrowdScore = 0,
      maxCrowdScore = 0,
    } = location;
    const total = minCrowdScore + moderateCrowdScore + maxCrowdScore;
    if (total > 0) {
      return minCrowdScore >= Math.max(moderateCrowdScore, maxCrowdScore);
    }

    return false;
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

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };
  {
    /*
  const handleAssignOrganizer = async (organizer) => {
    setSelectedOrganizer(organizer);
    setAssignModalVisible(true);
  };

  const confirmAssignment = async () => {
    if (!selectedOrganizer || !locationId) return;

    setAssignLoading(true);
    try {
      console.log("Assigning organizer:", {
        organizerId: selectedOrganizer._id,
        locationId: locationId,
        locationName: locationName,
      });

      const response = await fetch(
        `${API_BASE_URL}/locations/assign-organizer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizerId: selectedOrganizer._id,
            locationId: locationId,
            locationName: locationName,
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error(
          "Server returned non-JSON response. Please check server status."
        );
      }

      const result = await response.json();
      console.log("Assignment result:", result);

      if (result.success || result.message === "success" || response.ok) {
        Alert.alert(
          "Success",
          `${selectedOrganizer.name} has been assigned to ${locationName}`,
          [
            {
              text: "OK",
              onPress: () => {
                setAssignModalVisible(false);
                setSelectedOrganizer(null);
                fetchData(false); // Refresh data
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || result.error || "Assignment failed");
      }
    } catch (error) {
      console.error("Error assigning organizer:", error);

      let errorMessage = "Failed to assign organizer. Please try again.";

      if (error.name === "SyntaxError" && error.message.includes("JSON")) {
        errorMessage =
          "Server error: Unable to process the request. Please check if the server is running properly.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Assignment Error", errorMessage);
    } finally {
      setAssignLoading(false);
    }
  };
*/
  }

  const handleAssignOrganizer = async (organizer) => {
    setSelectedOrganizer(organizer);
    setAssignModalVisible(true);
  };

  {
    /*
  const confirmAssignment = async () => {
    if (!selectedOrganizer || !locationId) return;

    setAssignLoading(true);
    try {
      console.log("Assigning organizer:", {
        organizerId: selectedOrganizer._id,
        locationName: locationName,
      });

      // Update the organizer's assignedHall field with the location name
      const response = await fetch(
        `${API_BASE_URL}/users/organizers/${selectedOrganizer._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedHall: locationName,
            status: "Busy", // Also update status to Busy
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error(
          "Server returned non-JSON response. Please check server status."
        );
      }

      const result = await response.json();
      console.log("Assignment result:", result);

      if (result.organizer) {
        Alert.alert(
          "Success",
          `${selectedOrganizer.name} has been assigned to ${locationName}`,
          [
            {
              text: "OK",
              onPress: () => {
                setAssignModalVisible(false);
                setSelectedOrganizer(null);
                fetchData(false); // Refresh data
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || "Assignment failed");
      }
    } catch (error) {
      console.error("Error assigning organizer:", error);

      let errorMessage = "Failed to assign organizer. Please try again.";

      if (error.name === "SyntaxError" && error.message.includes("JSON")) {
        errorMessage =
          "Server error: Unable to process the request. Please check if the server is running properly.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Assignment Error", errorMessage);
    } finally {
      setAssignLoading(false);
    }
  };
  */
  }

  // Update the confirmAssignment function in AssignOrganizers.js

  const confirmAssignment = async () => {
    if (!selectedOrganizer || !locationId) return;

    setAssignLoading(true);
    try {
      console.log("Assigning organizer:", {
        organizerId: selectedOrganizer._id,
        locationName: locationName,
      });

      // Update the organizer's assignedHall field with the location name
      const response = await fetch(
        `${API_BASE_URL}/users/organizers/${selectedOrganizer._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedHall: locationName,
            // status: "Busy", // Keep commented as requested
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

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
      console.log("Assignment result:", result);

      if (result.organizer) {
        // Send in-app notification instead of SMS
        try {
          const notificationResponse = await fetch(
            `${API_BASE_URL}/notifications`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: selectedOrganizer._id,
                title: "New Location Assignment",
                content: `You have been assigned to ${locationName}. Current crowd level: ${crowdLevel}. Please proceed immediately.`,
                type: "assignment",
              }),
            }
          );

          const notificationResult = await notificationResponse.json();

          if (notificationResult.success) {
            console.log("In-app notification sent successfully");
          } else {
            console.warn(
              "Failed to send in-app notification:",
              notificationResult.message
            );
          }
        } catch (notificationError) {
          console.warn(
            "In-app notification sending failed:",
            notificationError
          );
        }

        /* Keep SMS code commented as requested
      try {
        const { result } = await SMS.sendSMSAsync(
          [selectedOrganizer.phone],
          `You have been assigned to ${locationName}. Current crowd level: ${crowdLevel}. Please proceed immediately.`
        );

        if (result === "sent") {
          console.log("SMS sent successfully");
        } else {
          console.log("SMS could not be sent:", result);
        }
      } catch (smsError) {
        console.warn("SMS sending failed:", smsError);
      }
      */

        Alert.alert(
          "Success",
          `${selectedOrganizer.name} has been assigned to ${locationName} and notified through the app.`,
          [
            {
              text: "OK",
              onPress: () => {
                setAssignModalVisible(false);
                setSelectedOrganizer(null);
                fetchData(false);
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || "Assignment failed");
      }
    } catch (error) {
      console.log("Error assigning organizer:", error);

      let errorMessage = "Failed to assign organizer. Please try again.";

      if (error.name === "SyntaxError" && error.message.includes("JSON")) {
        errorMessage =
          "Server error: Unable to process the request. Please check if the server is running properly.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Assignment Error", errorMessage);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignOrganizer = async (organizer) => {
    Alert.alert(
      "Confirm Unassignment",
      `Are you sure you want to unassign ${organizer.name} from ${organizer.assignedLocation}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unassign",
          style: "destructive",
          onPress: async () => {
            try {
              // Update the organizer's assignedHall to empty string
              const response = await fetch(
                `${API_BASE_URL}/users/organizers/${organizer._id}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    assignedHall: "",
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

              if (result.organizer) {
                Alert.alert("Success", `${organizer.name} has been unassigned`);
                fetchData(false);
              } else {
                throw new Error(result.message || "Unassignment failed");
              }
            } catch (error) {
              console.log("Error unassigning organizer:", error);

              let errorMessage =
                "Failed to unassign organizer. Please try again.";

              if (
                error.name === "SyntaxError" &&
                error.message.includes("JSON")
              ) {
                errorMessage =
                  "Server error: Unable to process the request. Please check if the server is running properly.";
              } else if (error.message) {
                errorMessage = error.message;
              }

              Alert.alert("Unassignment Error", errorMessage);
            }
          },
        },
      ]
    );
  };

  // Search functionality - Only search by name
  const filterOrganizers = (organizers) => {
    if (!searchQuery.trim()) return organizers;

    return organizers.filter((organizer) =>
      organizer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getStatusColor = (status) => {
    const statusColors = {
      available: "#4CAF50",
      assigned: "#FF9800",
      busy: "#F44336",
    };
    return statusColors[status?.toLowerCase()] || "#999";
  };

  const getCrowdLevelColor = (level) => {
    const crowdColors = {
      "low crowd": "#4CAF50",
      "moderate crowd": "#FF9800",
      "high crowd": "#F44336",
    };
    return crowdColors[level?.toLowerCase()] || "#999";
  };

  const handleHome = () => {
    router.push("../../dashboard");
  };

  const renderAvailableOrganizer = (organizer, index) => (
    <View key={organizer._id || index} style={styles.organizerCard}>
      <View style={styles.organizerHeader}>
        <View style={styles.organizerInfo}>
          <Text style={styles.organizerName}>
            {organizer.name || "Unknown"}
          </Text>
          <Text style={styles.organizerEmail}>
            {organizer.email || "No email"}
          </Text>
          <Text style={styles.organizerPhone}>
            {organizer.phone || "No phone"}
          </Text>
          <Text style={styles.organizerType}>
            Type: {organizer.userType || "Unknown"}
          </Text>
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
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => handleAssignOrganizer(organizer)}
          >
            <Icon name="person-add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAssignedOrganizer = (organizer, index) => (
    <View key={organizer._id || index} style={styles.assignedOrganizerCard}>
      <View style={styles.organizerHeader}>
        <View style={styles.organizerInfo}>
          <Text style={styles.organizerName}>
            {organizer.name || "Unknown"}
          </Text>
          <Text style={styles.organizerEmail}>
            {organizer.email || "No email"}
          </Text>
          <Text style={styles.organizerPhone}>
            {organizer.phone || "No phone"}
          </Text>
          <View style={styles.assignmentInfo}>
            <Icon name="location-on" size={16} color="#007AFF" />
            <Text style={styles.assignedLocationText}>
              Assigned to: {organizer.assignedLocation || "Unknown"}
            </Text>
          </View>
          <View style={styles.crowdInfo}>
            <Icon name="trending-down" size={16} color="#4CAF50" />
            <Text style={styles.crowdText}>
              Current crowd: {organizer.currentCrowdLevel || "Unknown"}
            </Text>
          </View>
        </View>
        <View style={styles.organizerActions}>
          <TouchableOpacity
            style={styles.unassignButton}
            onPress={() => handleUnassignOrganizer(organizer)}
          >
            <Icon name="person-remove" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Filter organizers based on search
  const filteredAvailableOrganizers = filterOrganizers(availableOrganizers);
  const filteredAssignedOrganizers = filterOrganizers(assignedOrganizers);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading organizer data...</Text>
      </View>
    );
  }

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
        <Text style={styles.header}>Assign Organizers</Text>
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
        <View style={styles.locationInfoCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>Current Location</Text>
            <View
              style={[
                styles.crowdBadge,
                { backgroundColor: getCrowdLevelColor(crowdLevel) },
              ]}
            >
              <Text style={styles.crowdBadgeText}>
                {crowdLevel || "Unknown"}
              </Text>
            </View>
          </View>
          <Text style={styles.locationName}>
            {locationName || "Unknown Location"}
          </Text>
          <Text style={styles.locationDetails}>
            Capacity: {locationCapacity || "Unknown"} people
          </Text>
          <Text style={styles.locationId}>ID: {locationId || "Unknown"}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search organizers by name..."
            placeholderTextColor="#837f7fff"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="clear" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Auto-refresh indicator */}
        <View style={styles.autoRefreshIndicator}>
          <Icon name="autorenew" size={16} color="#007AFF" />
          <Text style={styles.autoRefreshText}>
            Auto-refreshing every 10 seconds
          </Text>
          <Text style={styles.autoRefreshText}>
            • Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>

        {/* Available Organizers Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="people" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Available Organizers</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {filteredAvailableOrganizers.length}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Organizers with "Available" status and not currently assigned to any
            location
          </Text>

          {filteredAvailableOrganizers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="person-off" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No organizers match your search"
                  : "No available organizers"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "All organizers are either busy or already assigned to locations"}
              </Text>
            </View>
          ) : (
            filteredAvailableOrganizers.map((organizer, index) =>
              renderAvailableOrganizer(organizer, index)
            )
          )}
        </View>

        {/* Assigned Organizers in Low Crowd Locations */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="assignment-ind" size={24} color="#FF9800" />
            <Text style={styles.sectionTitle}>
              Organizers in Low Crowd Areas
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {filteredAssignedOrganizers.length}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Organizers currently assigned to locations with low crowd levels -
            available for reassignment
          </Text>

          {filteredAssignedOrganizers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="assignment" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No organizers match your search"
                  : "No organizers in low crowd areas"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "All assigned organizers are in high-priority locations or no assignments exist"}
              </Text>
            </View>
          ) : (
            filteredAssignedOrganizers.map((organizer, index) =>
              renderAssignedOrganizer(organizer, index)
            )
          )}
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

      {/* Assignment Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={assignModalVisible}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Assignment</Text>

            {selectedOrganizer && (
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>
                  Assign{" "}
                  <Text style={styles.boldText}>{selectedOrganizer.name}</Text>{" "}
                  to:
                </Text>
                <Text style={styles.modalLocationText}>{locationName}</Text>
                <Text style={styles.modalDetails}>
                  Current crowd level:{" "}
                  <Text
                    style={[
                      styles.boldText,
                      { color: getCrowdLevelColor(crowdLevel) },
                    ]}
                  >
                    {crowdLevel}
                  </Text>
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAssignModalVisible(false)}
                disabled={assignLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  assignLoading && styles.disabledButton,
                ]}
                onPress={confirmAssignment}
                disabled={assignLoading}
              >
                {assignLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="check" size={20} color="white" />
                    <Text style={styles.confirmButtonText}>Assign</Text>
                  </>
                )}
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
  locationInfoCard: {
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
  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  crowdBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  crowdBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  locationName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  locationDetails: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  locationId: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
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
  sectionCard: {
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    marginTop: -10,
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
  organizerCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  assignedOrganizerCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#fff3e0",
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
    marginBottom: 5,
  },
  organizerEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  organizerPhone: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  organizerType: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  assignmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  assignedLocationText: {
    fontSize: 12,
    color: "#007AFF",
    marginLeft: 5,
    fontWeight: "500",
  },
  crowdInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  crowdText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 5,
    fontWeight: "500",
  },
  organizerActions: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  assignButton: {
    backgroundColor: "#4CAF50",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unassignButton: {
    backgroundColor: "#F44336",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalBody: {
    marginBottom: 25,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  modalLocationText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 10,
  },
  modalDetails: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  boldText: {
    fontWeight: "bold",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginLeft: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.6,
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

export default AssignOrganizers;
