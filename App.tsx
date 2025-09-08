import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { UserProvider, useUser } from './contexts/UserContext';
import { ProjectsProvider } from './contexts/ProjectsContext';

import ProjectsScreen from './screens/ProjectsScreen';
import ProjectDashboard from './screens/ProjectDashboard';
import ProjectPreview from './screens/ProjectPreview';
import AuthScreen from './screens/AuthScreen';
import { palette } from './theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.bg,
    card: palette.bg,
    text: palette.text,
    border: palette.border,
    primary: palette.accent,
  },
};

const Stack = createNativeStackNavigator();

function RootNav() {
  const { loading, user } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.text }}>Загрузка…</Text>
      </View>
    );
  }

  return (
    <ProjectsProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerTintColor: palette.text,
            headerTitleStyle: { color: palette.text },
            headerBackground: () => <View style={{ flex: 1, backgroundColor: palette.bg }} />, // без градиентов
            contentStyle: { backgroundColor: palette.bg },
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
    </ProjectsProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <RootNav />
    </UserProvider>
  );
}
