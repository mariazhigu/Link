import "react-native-gesture-handler";
import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { UserProvider, useUser } from "./contexts/UserContext";
import { ProjectsProvider } from "./contexts/ProjectsContext";

import AuthScreen from "./screens/AuthScreen";
import ProjectsMenuScreen from "./screens/ProjectsMenuScreen";
import ProjectDashboard from "./screens/ProjectDashboard";
import PublicViewScreen from "./screens/PublicViewScreen";
import TemplatePickerScreen from "./screens/TemplatePickerScreen";
import ProjectSettingsScreen from "./screens/ProjectSettingsScreen";
import MembersScreen from "./screens/MembersScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useUser();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="ProjectsMenu" component={ProjectsMenuScreen} />
          <Stack.Screen name="ProjectDashboard" component={ProjectDashboard} />
          <Stack.Screen name="PublicView" component={PublicViewScreen} />
          <Stack.Screen name="TemplatePicker" component={TemplatePickerScreen} />
          <Stack.Screen name="ProjectSettings" component={ProjectSettingsScreen} />
          <Stack.Screen name="Members" component={MembersScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!fontsLoaded) return null;

  Text.defaultProps = Text.defaultProps || {};
  const prev = Text.defaultProps.style;
  Text.defaultProps.style = [{ fontFamily: "Inter_400Regular" }].concat(
    Array.isArray(prev) ? prev : prev ? [prev] : []
  );

  return (
    <UserProvider>
      <ProjectsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </GestureHandlerRootView>
      </ProjectsProvider>
    </UserProvider>
  );
}
