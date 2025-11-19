import React, { useState } from "react";
import { API_BASE_URL } from "../../../config";

import { Image } from "react-native";
import EngExLogo from "../../../assets/images/EngEx-logo.png";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router"; // Import router from expo-router

const RegisterScreen = () => {
  const [role, setRole] = useState("organizer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Your backend URL - Update this to your actual backend URL
  const BACKEND_URL = `${API_BASE_URL}`; // Change to your server URL
  // For Android emulator: "http://10.0.2.2:4000"
  // For iOS simulator: "http://localhost:4000"
  // For physical device: "http://YOUR_COMPUTER_IP:4000"

  const registerUser = async (userData) => {
    try {
      setIsLoading(true);

      // console.log("set loading is true");

      const response = await fetch(`${BACKEND_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.status === "ok") {
        Alert.alert("Success", data.message || "Registration successful!", [
          {
            text: "OK",
            onPress: () => {
              // Clear form fields
              setName("");
              setEmail("");
              setPassword("");
              setConfirmPassword("");
              setPhone("");
              setRole("organizer");

              // Navigate to login screen using Expo Router
              router.push("/auth/LoginScreen");
            },
          },
        ]);
      } else {
        Alert.alert(
          "Registration Failed",
          data.message || "Something went wrong"
        );
      }
    } catch (error) {
      console.log("Registration error:", error);
      Alert.alert(
        "Network Error",
        "Unable to connect to server. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Only require phone for organizer role
    if (role === "organizer" && !phone) {
      Alert.alert("Error", "Phone number is required for organizers");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    // Basic phone validation for organizer
    if (
      role === "organizer" &&
      phone &&
      !/^[\+]?[\d\s\-\(\)]{10,}$/.test(phone)
    ) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    // Prepare data for backend
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      userType: role === "organizer" ? "Organizer" : "Panel", // Capitalize to match model
    };

    // Add phone for organizer
    if (role === "organizer") {
      userData.phone = phone.trim();
      userData.assignedHall = ""; // Default value, can be updated later
      userData.status = "Available"; // Match enum: 'Available' or 'Busy'
    }

    // Send to backend
    console.log("Sending data to backend:", userData);
    await registerUser(userData);
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    // Clear phone when switching to panel role
    if (selectedRole !== "organizer") {
      setPhone("");
    }
  };

  const navigateToLogin = () => {
    router.push("/auth/LoginScreen");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                {/* // Logo image */}
                <Image
                  source={EngExLogo}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join ENGEX Control System</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Role Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Register as</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleRoleChange("organizer")}
                  disabled={isLoading}
                >
                  <View style={styles.radioButton}>
                    {role === "organizer" && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Organizer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleRoleChange("panel")}
                  disabled={isLoading}
                >
                  <View style={styles.radioButton}>
                    {role === "panel" && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>Main Panel</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#837f7fff"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#837f7fff"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Phone Input - Only show for organizer */}
            {role === "organizer" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Phone Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, isLoading && styles.inputDisabled]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#837f7fff"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password (min 6 characters)"
                placeholderTextColor="#837f7fff"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#837f7fff"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
                <Text
                  style={[styles.loginLink, isLoading && styles.linkDisabled]}
                >
                  Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e40af",
  },
  scrollContent: {
    marginTop: 10,
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  logoImage: {
    width: 80,
    height: 80,
  },

  logoContainer: {
    marginBottom: 16,
  },

  logoPlaceholder: {
    width: 100,
    height: 80,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  logoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1e40af",
  },
  radioLabel: {
    fontSize: 16,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#9ca3af",
  },
  registerButton: {
    backgroundColor: "#1e40af",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loginLink: {
    fontSize: 14,
    color: "#1e40af",
    fontWeight: "600",
  },
  linkDisabled: {
    color: "#9ca3af",
  },
});

export default RegisterScreen;
