import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { queryClient, wireAppStateToQuery } from '@/shared/query/client';
import { realtime } from '@/shared/realtime/client';
import { installAuthInterceptor, useSession } from '@/features/auth';

export default function RootLayout() {
  useEffect(() => {
    // A ordem importa: o interceptor precisa estar instalado antes de qualquer
    // requisição ou handshake de socket. Ver docs/architecture.md > Boot.
    installAuthInterceptor();
    void useSession.getState().hydrate();
    const unwireFocus = wireAppStateToQuery();
    realtime.connect();

    return () => {
      unwireFocus();
      realtime.disconnect();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
