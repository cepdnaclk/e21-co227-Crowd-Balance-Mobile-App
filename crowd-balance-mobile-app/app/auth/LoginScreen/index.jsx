import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage"; // store login user detais during the login period
import { router } from "expo-router";
import { Stack } from "expo-router";
import { API_BASE_URL } from "../../../config";

import EngExLogo from "../../../assets/images/EngEx-logo.png";

const Login = () => {
  const [role, setRole] = useState("organizer");
  const [user, setUser] = useState({
    gmail: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (name, value) => {
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user.gmail || !user.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        gmail: String(user.gmail),
        password: String(user.password),
      });

      const data = response.data;
      console.log("Login response:", data);

      if (data.status === "ok") {
        // Store user data in AsyncStorage
        await AsyncStorage.setItem("userId", data.userId);
        await AsyncStorage.setItem("userName", data.name);
        await AsyncStorage.setItem("userType", data.userType);
        await AsyncStorage.setItem("isLoggedIn", "true");

        // Store the complete user data to avoid network call in dashboard
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify({
            id: data.userId,
            name: data.name,
            userType: data.userType,
            assignedHall: data.assignedHall || null,
          })
        );

        Alert.alert("Success", "Login Successful");

        // Add a small delay to ensure AsyncStorage operations complete
        setTimeout(() => {
          router.replace("/dashboard");
        }, 100);
      } else {
        Alert.alert("Login Failed", data.err || "Invalid credentials");
      }
    } catch (err) {
      console.log("Login error:", err);
      Alert.alert("Login Failed", err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
  };

  const navigateToRegister = () => {
    router.push("/auth/RegisterScreen");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoPlaceholder}>
                  <Image
                    source={EngExLogo}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={user.gmail}
                  onChangeText={(text) => handleInputChange("gmail", text)}
                  placeholder={
                    role === "panel" ? "panel@engex.com" : "organizer@engex.com"
                  }
                  placeholderTextColor="#837f7fff"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={user.password}
                  onChangeText={(text) => handleInputChange("password", text)}
                  placeholder="Enter your password"
                  placeholderTextColor="#837f7fff"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Logging in..." : `Login`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Navigate to Registration Page */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Not registered yet? </Text>
              <TouchableOpacity
                onPress={navigateToRegister}
                disabled={isLoading}
              >
                <Text
                  style={[styles.signUpText, isLoading && styles.disabledText]}
                >
                  SignUp
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e40af" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: { alignItems: "center", marginBottom: 24 },
  logoContainer: { marginBottom: 16 },
  logoPlaceholder: {
    width: 100,
    height: 80,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  logoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  form: { marginBottom: 24 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  radioGroup: { flexDirection: "row", justifyContent: "center", gap: 24 },
  radioOption: { flexDirection: "row", alignItems: "center" },
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
  radioLabel: { fontSize: 16, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  loginButton: {
    backgroundColor: "#1e40af",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  loginButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  loginText: { fontSize: 14, color: "#374151" },
  signUpText: { fontSize: 14, color: "#1e40af", fontWeight: "600" },
  disabledText: { color: "#9ca3af" },
});

export default Login;
