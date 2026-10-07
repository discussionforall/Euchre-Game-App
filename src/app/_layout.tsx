// Root layout: shared state for every screen, and the navigation stack.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppStateProvider } from '../ui/AppState';
import { colors } from '../ui/theme';

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.felt },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="game" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="rules" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="light" />
    </AppStateProvider>
  );
}
