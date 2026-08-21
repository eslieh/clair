import { Stack } from 'expo-router';
import { View } from 'react-native';

import { CallProvider } from '@/contexts/CallContext';
import { Ringer } from '@/components/Ringer';
import { CallOverlay } from '@/components/CallOverlay';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const { profile, isLoading } = useProfile();
  const theme = useTheme();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  const needsSetup = !profile?.username || !profile?.display_name;

  return (
    <CallProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={needsSetup}>
          <Stack.Screen name="setup" />
        </Stack.Protected>

        <Stack.Protected guard={!needsSetup}>
          <Stack.Screen name="calls/index" />
          <Stack.Screen name="call/[id]" options={{ gestureEnabled: false }} />
          <Stack.Screen name="new-call" options={{ presentation: 'modal' }} />
          <Stack.Screen name="call-detail" options={{ presentation: 'modal' }} />
          <Stack.Screen name="account" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>

      <Ringer />
      <CallOverlay />
    </CallProvider>
  );
}
