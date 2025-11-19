import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [assignedHall, setAssignedHall] = useState("");
  const [status, setStatus] = useState("Available");

  useEffect(() => {
    const fetchUser = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        router.replace("/auth/LoginScreen");
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/users/${userId}`);
        const u = res.data.user;
        setUser(u);
        setName(u.name);
        setPhone(u.phone || "");
        setAssignedHall(u.assignedHall || "");
        setStatus(u.status || "Available");
      } catch (err) {
        console.log(err);
        router.replace("/auth/LoginScreen");
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace("/auth/LoginScreen");
          },
        },
      ]
    );
  };

  // Custom Status Picker Component
  const StatusPicker = () => {
    return (
      <View style={styles.statusPickerContainer}>
        <TouchableOpacity
          style={[
            styles.statusOption,
            status === "Available" && styles.statusOptionSelected,
          ]}
          onPress={() => setStatus("Available")}
        >
          <Text
            style={[
              styles.statusOptionText,
              status === "Available" && styles.statusOptionTextSelected,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusOption,
            status === "Busy" && styles.statusOptionSelected,
          ]}
          onPress={() => setStatus("Busy")}
        >
          <Text
            style={[
              styles.statusOptionText,
              status === "Busy" && styles.statusOptionTextSelected,
            ]}
          >
            Busy
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedUser = {
        name: name.trim(),
        phone: phone.trim(),
        status,
      };

      console.log("API URL:", `${API_BASE_URL}/users/organizers/${user._id}`);
      console.log("User ID:", user._id);
      console.log("Updated User Data:", updatedUser);

      const res = await axios.put(
        `${API_BASE_URL}/users/organizers/${user._id}`,
        updatedUser
      );
      
      console.log("Profile updated successfully");

      // Update local state with response data
      setUser(res.data.user);
      setIsEditing(false);
      
      // Show success message
      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => {
            // Navigate after user acknowledges the success
            setTimeout(() => {
              router.replace("/dashboard");
            }, 100);
          },
        },
      ]);

    } catch (err) {
      console.log("Error updating profile:", err);
      Alert.alert(
        "Error", 
        err.response?.data?.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setName(user.name);
    setPhone(user.phone || "");
    setStatus(user.status || "Available");
    setIsEditing(false);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loading}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>

        {isEditing ? (
          <>
            <Text style={styles.label}>Name:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              editable={!isLoading}
            />

            {user.userType === "Organizer" && (
              <>
                <Text style={styles.label}>Phone:</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />

                <Text style={styles.label}>Status:</Text>
                <StatusPicker />
              </>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, isLoading && styles.disabledButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value}>{user._id}</Text>

            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{user.name}</Text>

            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user.email}</Text>

            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{user.userType}</Text>

            {user.userType === "Organizer" && (
              <>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{user.phone || "Not provided"}</Text>

                <Text style={styles.label}>Assigned Hall:</Text>
                <Text style={styles.value}>
                  {user.assignedHall || "Not Assigned"}
                </Text>

                <Text style={styles.label}>Status:</Text>
                <Text
                  style={[
                    styles.value,
                    user.status === "Available"
                      ? styles.statusAvailable
                      : styles.statusBusy,
                  ]}
                >
                  {user.status}
                </Text>
              </>
            )}
            {user.userType === "Organizer" && (
              <TouchableOpacity
                style={styles.carParksButton}
                onPress={() => router.push('/CarParks')}
              >
                <Text style={styles.carParksText}>Car Parks</Text>
              </TouchableOpacity>
            )}
            {user.userType === "Organizer" && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  statusPickerContainer: {
    flexDirection: "row",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  statusOptionSelected: {
    backgroundColor: "#1e40af",
  },
  statusOptionText: {
    fontSize: 16,
    color: "#333",
  },
  statusOptionTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  statusAvailable: {
    color: "green",
    fontWeight: "bold",
  },
  statusBusy: {
    color: "red",
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#1e40af",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  editText: { 
    color: "white", 
    fontWeight: "600", 
    fontSize: 16 
  },
  saveButton: {
    backgroundColor: "#1e40af",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 0.48,
  },
  saveText: { 
    color: "white", 
    fontWeight: "600", 
    fontSize: 16 
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 0.48,
  },
  cancelText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  carParksButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  carParksText: { color: 'white', fontWeight: '600', fontSize: 16 },
  loading: {
    fontSize: 18,
    color: "#555",
    marginTop: 10,
  },
});

export default Profile;