import { Stack } from "expo-router";

function CrowdLayout() {
  return (
    <Stack>
      <Stack.Screen 
      name="MainPanelCrowdStatus/index" 
      options={{ headerShown: false }}
       />
      <Stack.Screen
        name="OrganizerCrowdStatus/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LocationDetails/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AssignOrganizers/index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default CrowdLayout;
