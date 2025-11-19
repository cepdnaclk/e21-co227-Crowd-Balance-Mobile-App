import { Stack } from "expo-router";

function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="LoginScreen/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="RegisterScreen/index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default AuthLayout;
