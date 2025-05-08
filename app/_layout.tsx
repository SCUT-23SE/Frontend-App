import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/stores/auth';

export default function RootLayout() {
  useFrameworkReady();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);

  return (
    <>
      {!isAuthenticated ? <Redirect href="/login" /> : <Redirect href="/tasks" />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}