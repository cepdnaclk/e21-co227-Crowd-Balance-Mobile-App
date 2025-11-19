import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        console.log("Checking login status...");
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        console.log("Login status:", isLoggedIn);

        if (isLoggedIn === "true") {
          console.log("User is logged in, navigating to dashboard");
          router.replace("/dashboard");
        } else {
          console.log("User is not logged in, navigating to login");
          router.replace("/auth/LoginScreen");
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        router.replace("/auth/LoginScreen");
      }

      console.log("*".repeat(50));
    };

    // Add a small delay to ensure router is ready
    setTimeout(() => {
      checkLogin();
    }, 100);
  }, [router]);

  console.log("Index component rendering");

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
      }}
    >
      <ActivityIndicator size="large" color="#1e40af" />
      <Text style={{ marginTop: 20 }}>Loading...</Text>
    </View>
  );
};

export default Index;
