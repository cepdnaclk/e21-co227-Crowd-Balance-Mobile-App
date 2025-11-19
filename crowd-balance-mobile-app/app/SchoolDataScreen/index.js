import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";

import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const SchoolDataScreen = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    schoolNumber: "",
    schoolName: "",
    guardian: "",
    phoneNumber: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe async function wrapper
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

  // Fetch user data
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

        // Try to get user data from AsyncStorage first
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          if (isMountedRef.current) {
            setUser(userData);
          }
          return userData;
        }

        // Fallback: Fetch from server
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
          timeout: 10000,
        });
        console.log("School: users " + response);

        if (response.data && response.data.user && isMountedRef.current) {
          setUser(response.data.user);
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(response.data.user)
          );
          return response.data.user;
        }
      } catch (error) {
        console.log("Error fetching user:", error);
        
        // Fallback to AsyncStorage data
        try {
          const userName = await AsyncStorage.getItem("userName");
          const userType = await AsyncStorage.getItem("userType");
          const userId = await AsyncStorage.getItem("userId");

          if (userName && userType && isMountedRef.current) {
            const userData = { name: userName, userType: userType, id: userId };
            setUser(userData);
            return userData;
          } else {
            await AsyncStorage.clear();
            router.replace("/auth/login");
          }
        } catch (fallbackError) {
          console.log("Fallback error:", fallbackError);
          await AsyncStorage.clear();
          router.replace("/auth/login");
        }
      }
    }),
    [safeAsync]
  );

  // Fetch schools data
  const fetchSchools = useCallback(
    safeAsync(async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/schools/`, {
          timeout: 10000,
        });

        if (response.data && response.data.success && isMountedRef.current) {
          setSchools(response.data.schools || []);
          console.log("Fetched schools:", response.data.schools?.length || 0);
        }
      } catch (error) {
        console.log("Error fetching schools:", error);
        if (isMountedRef.current) {
          Alert.alert(
            "Error",
            "Failed to load school data. Please try again.",
            [{ text: "OK" }]
          );
          setSchools([]);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }),
    [safeAsync]
  );

  // Search schools
  const searchSchools = useCallback(
    safeAsync(async (query) => {
      if (!query.trim()) {
        fetchSchools();
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/schools/search?query=${encodeURIComponent(query)}`,
          { timeout: 10000 }
        );

        if (response.data && response.data.success && isMountedRef.current) {
          setSchools(response.data.schools || []);
        }
      } catch (error) {
        console.log("Error searching schools:", error);
        if (isMountedRef.current) {
          Alert.alert(
            "Error",
            "Search failed. Please try again.",
            [{ text: "OK" }]
          );
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }),
    [safeAsync, fetchSchools]
  );

  // Handle search input change
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (text.trim()) {
        searchSchools(text);
      } else {
        fetchSchools();
      }
    }, 3000); // adjust this to smooth search feature

    return () => clearTimeout(timeoutId);
  }, [searchSchools, fetchSchools]);

  // Create or update school
  const handleSubmit = useCallback(
    safeAsync(async () => {
      const { schoolNumber, schoolName, guardian, phoneNumber } = formData;

      // Validation
      if (!schoolNumber.trim() || !schoolName.trim() || !guardian.trim() || !phoneNumber.trim()) {
        Alert.alert("Error", "All fields are required.", [{ text: "OK" }]);
        return;
      }

      if (!user?.id) {
        Alert.alert("Error", "User information not available. Please login again.", [{ text: "OK" }]);
        return;
      }

      setFormLoading(true);

      try {
        const payload = {
          schoolNumber: schoolNumber.trim(),
          schoolName: schoolName.trim(),
          guardian: guardian.trim(),
          phoneNumber: phoneNumber.trim(),
          userId: user.id,
        };

        let response;
        if (editingSchool) {
          // Update existing school
          response = await axios.put(
            `${API_BASE_URL}/schools/${editingSchool._id}`,
            payload,
            { timeout: 10000 }
          );
        } else {
          // Create new school
          response = await axios.post(`${API_BASE_URL}/schools/`, payload, {
            timeout: 10000,
          });
        }

        if (response.data && response.data.success && isMountedRef.current) {
          Alert.alert(
            "Success",
            editingSchool ? "School updated successfully!" : "School created successfully!",
            [{ text: "OK" }]
          );
          
          // Reset form and close modal
          resetForm();
          setModalVisible(false);
          
          // Refresh schools list
          fetchSchools();
        }
      } catch (error) {
        console.log("Error submitting school:", error);
        
        if (!isMountedRef.current) return;

        let errorMessage = editingSchool 
          ? "Failed to update school. Please try again." 
          : "Failed to create school. Please try again.";

        if (error.response && error.response.data) {
          errorMessage = error.response.data.message || error.response.data.errors?.join(", ") || errorMessage;
        } else if (error.request) {
          errorMessage = "Network error. Please check your connection.";
        }

        Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      } finally {
        if (isMountedRef.current) {
          setFormLoading(false);
        }
      }
    }),
    [safeAsync, formData, user, editingSchool, fetchSchools]
  );

  // Delete school
  const handleDelete = useCallback((school) => {
    Alert.alert(
      "Delete School",
      `Are you sure you want to delete "${school.schoolName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${API_BASE_URL}/schools/${school._id}`,
                { timeout: 10000 }
              );

              if (response.data && response.data.success && isMountedRef.current) {
                Alert.alert("Success", "School deleted successfully!", [
                  { text: "OK" },
                ]);
                fetchSchools();
              }
            } catch (error) {
              console.log("Error deleting school:", error);

              if (!isMountedRef.current) return;

              let errorMessage = "Failed to delete school. Please try again.";
              if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
              }

              Alert.alert("Error", errorMessage, [{ text: "OK" }]);
            }
          },
        },
      ]
    );
  }, [fetchSchools]);

  // Open edit modal
  const handleEdit = useCallback((school) => {
    setEditingSchool(school);
    setFormData({
      schoolNumber: school.schoolNumber,
      schoolName: school.schoolName,
      guardian: school.guardian,
      phoneNumber: school.phoneNumber,
    });
    setModalVisible(true);
  }, []);

  // Open add modal
  const handleAdd = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setEditingSchool(null);
    setFormData({
      schoolNumber: "",
      schoolName: "",
      guardian: "",
      phoneNumber: "",
    });
  }, []);

  // Refresh function
  const onRefresh = useCallback(
    safeAsync(async () => {
      setRefreshing(true);
      try {
        await fetchSchools();
      } catch (error) {
        console.log("Error during refresh:", error);
      } finally {
        if (isMountedRef.current) {
          setRefreshing(false);
        }
      }
    }),
    [safeAsync, fetchSchools]
  );

  // Format phone number for display
  const formatPhoneNumber = useCallback((phoneNumber) => {
    if (!phoneNumber) return "N/A";
    return phoneNumber.length > 10 ? 
      `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}` : 
      phoneNumber;
  }, []);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = await fetchUser();
        if (userData) {
          await fetchSchools();
        }
      } catch (error) {
        console.log("Error initializing data:", error);
      }
    };

    initializeData();
  }, [fetchUser, fetchSchools]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading school data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>School Data</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools..."
          placeholderTextColor="#837f7fff"
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+ Add School</Text>
        </TouchableOpacity>
      </View>

      {/* Schools List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.countText}>
          Total Schools: {schools.length}
        </Text>

        {schools.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataIcon}>📚</Text>
            <Text style={styles.noDataText}>No Schools Found</Text>
            <Text style={styles.noDataSubtext}>
              {searchQuery 
                ? "No schools match your search criteria." 
                : "No school data available. Add some schools to get started."}
            </Text>
          </View>
        ) : (
          <View style={styles.schoolsList}>
            {schools.map((school) => (
              <View key={school._id} style={styles.schoolCard}>
                <View style={styles.schoolHeader}>
                  <View style={styles.schoolMainInfo}>
                    <Text style={styles.schoolNumber}>{school.schoolNumber}</Text>
                    <Text style={styles.schoolName}>{school.schoolName}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(school)}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(school)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.schoolDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Guardian:</Text>
                    <Text style={styles.detailValue}>{school.guardian}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {formatPhoneNumber(school.phoneNumber)}
                    </Text>
                  </View>
                  {/* {school.createdBy && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Added by:</Text>
                      <Text style={styles.detailValueSmall}>
                        {school.createdBy.name} ({school.createdBy.userType})
                      </Text>
                    </View>
                  )} */}
                  {school.updatedBy && school.updatedBy._id !== school.createdBy?._id && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Updated by:</Text>
                      <Text style={styles.detailValueSmall}>
                        {school.updatedBy.name} ({school.updatedBy.userType})
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          resetForm();
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSchool ? "Edit School" : "Add New School"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>School Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter school number (e.g., SCH001)"
                  placeholderTextColor="#837f7fff"
                  value={formData.schoolNumber}
                  onChangeText={(text) =>
                    setFormData({ ...formData, schoolNumber: text })
                  }
                  autoCapitalize="characters"
                  editable={!formLoading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>School Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter school name"
                  placeholderTextColor="#837f7fff"
                  value={formData.schoolName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, schoolName: text })
                  }
                  autoCapitalize="words"
                  editable={!formLoading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Guardian Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter guardian name"
                  placeholderTextColor="#837f7fff"
                  value={formData.guardian}
                  onChangeText={(text) =>
                    setFormData({ ...formData, guardian: text })
                  }
                  autoCapitalize="words"
                  editable={!formLoading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter phone number"
                  placeholderTextColor="#837f7fff"
                  value={formData.phoneNumber}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phoneNumber: text })
                  }
                  keyboardType="phone-pad"
                  editable={!formLoading}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    resetForm();
                    setModalVisible(false);
                  }}
                  disabled={formLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.submitButton,
                    formLoading && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingSchool ? "Update" : "Create"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#1e40af",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerSpacer: {
    width: 50,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  addButton: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  countText: {
    fontSize: 16,
    color: "#6b7280",
    paddingVertical: 15,
    fontWeight: "600",
  },
  noDataContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginVertical: 20,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  schoolsList: {
    paddingBottom: 20,
  },
  schoolCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  schoolHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  schoolMainInfo: {
    flex: 1,
  },
  schoolNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#f59e0b",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
  },
  schoolDetails: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: "#1f2937",
    flex: 1,
  },
  detailValueSmall: {
    fontSize: 12,
    color: "#6b7280",
    flex: 1,
    fontStyle: "italic",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "bold",
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#1e40af",
  },
  submitButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
});

export default SchoolDataScreen;