import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { UserProvider, useUser } from './contexts/UserContext';
import { ProjectsProvider, useProjects } from './contexts/ProjectsContext';

import ProjectsScreen from './screens/ProjectsScreen';
import ProjectDashboard from './screens/ProjectDashboard';
import ProjectPreview from './screens/ProjectPreview';
import AuthScreen from './screens/AuthScreen';
import { getPalette } from './theme';

const Stack = createNativeStackNavigator();

function RootNav() {
  const { loading, user } = useUser();
  const { currentProject } = useProjects();
  const pal = getPalette(currentProject?.themeKey ?? 'latte');

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: pal.bg,
      card: pal.bg,
      text: pal.text,
      border: pal.border,
      primary: pal.accent,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: pal.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: pal.text }}>Загрузка…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: pal.text,
          headerTitleStyle: { color: pal.text },
          headerBackground: () => <View style={{ flex: 1, backgroundColor: pal.bg }} />,
          contentStyle: { backgroundColor: pal.bg },
        }}
      >
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: 'LinkPro — проекты' }} />
            <Stack.Screen name="Dashboard" component={ProjectDashboard} options={{ title: 'Редактор' }} />
            <Stack.Screen name="Preview" component={ProjectPreview} options={{ title: 'Превью' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <ProjectsProvider>
        <RootNav />
      </ProjectsProvider>
    </UserProvider>
  );
}
