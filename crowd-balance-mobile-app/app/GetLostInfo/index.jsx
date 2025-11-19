import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../config";

const GetLostInfo = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    location: "",
    description: "",
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    // Request permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!"
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Reduced quality for smaller file size
      base64: true, // Get base64 string
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    // Request camera permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera is required!"
      );
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Reduced quality for smaller file size
      base64: true, // Get base64 string
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const showImageOptions = () => {
    Alert.alert("Select Photo", "Choose how you'd like to add a photo", [
      { text: "Camera", onPress: takePhoto },
      { text: "Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.age.trim() || !formData.gender) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (Age, Gender, Last Seen Location)"
      );
      return;
    }

    // if (!photo) {
    //   Alert.alert("Error", "Please add a photo of the missing person");
    //   return;
    // }

    if (!formData.location.trim()) {
      Alert.alert("Error", "Please provide the last seen location");
      return;
    }

    // if (!formData.description.trim()) {
    //   Alert.alert("Error", "Please provide a description");
    //   return;
    // }

    setLoading(true);

    try {
      // Get user ID from AsyncStorage
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not authenticated. Please login again.");
        router.replace("/auth/login");
        return;
      }

      // Prepare the data
      const reportData = {
        name: formData.name ? formData.name.trim() : null,
        age: parseInt(formData.age),
        gender: formData.gender,
        image: photo ? `data:image/jpeg;base64,${photo.base64}` : null, // Convert to base64 data URL
        lastseenlocation: formData.location.trim(),
        description: formData.description.trim()
          ? [formData.description.trim()]
          : [], // Convert to array as expected by backend
        UserId: userId,
      };

      console.log("Sending report data...");

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/missing-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
        timeout: 15000, // 15 second timeout
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Report created successfully:");

        // Show success alert
        Alert.alert(
          "Alert Sent Successfully! ✅",
          "A high-priority alert has been sent to all organizers and panel members. The missing person report has been saved to the database.",
          [
            {
              text: "View Dashboard",
              onPress: () => router.push("/dashboard"), // Go to dashboard
            },
            {
              text: "Report Another",
              onPress: () => {
                // Reset form
                setFormData({
                  name: "",
                  age: "",
                  gender: "",
                  location: "",
                  description: "",
                });
                setPhoto(null);
              },
            },
          ]
        );
      } else {
        console.log("Server error:", result.message);
        Alert.alert(
          "Error",
          result.message || "Failed to send alert. Please try again."
        );
      }
    } catch (error) {
      console.log("Network error:", error);
      Alert.alert(
        "Network Error",
        "Unable to send alert. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.alertIcon}>🚨</Text>
          <View>
            <Text style={styles.title}>New Missing Person Alert</Text>
            <Text style={styles.subtitle}>
              Fill in the details below. This will notify all staff immediately.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., John Doe"
              placeholderTextColor="#545151ff"
              value={formData.name}
              onChangeText={(text) => handleInputChange("name", text)}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 7"
              placeholderTextColor="#545151ff"
              value={formData.age}
              onChangeText={(text) => handleInputChange("age", text)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* <View style={styles.inputContainer}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
              style={styles.picker}
            >
              <Picker.Item label="Select gender" value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
            </Picker>
          </View>
        </View> */}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderOptions}>
            <TouchableOpacity
              style={[
                styles.genderOption,
                formData.gender === "Male" && styles.genderOptionSelected,
              ]}
              onPress={() => handleInputChange("gender", "Male")}
            >
              <Text
                style={[
                  styles.genderOptionText,
                  formData.gender === "Male" && styles.genderOptionTextSelected,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderOption,
                formData.gender === "Female" && styles.genderOptionSelected,
              ]}
              onPress={() => handleInputChange("gender", "Female")}
            >
              <Text
                style={[
                  styles.genderOptionText,
                  formData.gender === "Female" &&
                    styles.genderOptionTextSelected,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Photo</Text>
          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={styles.photoPreview}
              onPress={showImageOptions}
            >
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.cameraIcon}>📷</Text>
                  <Text style={styles.photoText}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Seen Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Near Lecture Hall 5"
            placeholderTextColor="#545151ff"
            value={formData.location}
            onChangeText={(text) => handleInputChange("location", text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Wearing a blue t-shirt, red shorts, and a white cap."
            placeholderTextColor="#545151ff"
            value={formData.description}
            onChangeText={(text) => handleInputChange("description", text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Sending Alert..." : "🚨 Send Alert"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alertIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputContainer: {
    marginBottom: 20,
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  // pickerContainer: {
  //   borderWidth: 1,
  //   borderColor: "#d1d5db",
  //   borderRadius: 8,
  //   backgroundColor: "white",
  // },
  // picker: {
  //   ...Platform.select({
  //     ios: {
  //       height: 200, // enough space for iOS spinner
  //     },
  //     android: {
  //       height: 50, // typical dropdown height
  //     },
  //   }),
  // },
  photoContainer: {
    alignItems: "flex-start",
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#9ca3af",
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  photoPlaceholder: {
    alignItems: "center",
  },
  cameraIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoText: {
    fontSize: 12,
    color: "#616264ff",
    textAlign: "center",
  },
  submitButton: {
    marginBottom: 10,
    backgroundColor: "#1e40af",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  genderOptions: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    backgroundColor: "white",
  },
  genderOptionSelected: {
    borderColor: "#1e40af",
    backgroundColor: "#eff6ff",
  },
  genderOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  genderOptionTextSelected: {
    color: "#1e40af",
    fontWeight: "600",
  },
});

export default GetLostInfo;
