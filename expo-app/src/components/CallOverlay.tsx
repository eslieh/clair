import { Pressable, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Mic, MicOff, PhoneOff } from 'lucide-react-native';
import { RTCView } from 'react-native-webrtc';

import { CALL_STATES, useCall } from '@/contexts/CallContext';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function CallOverlay() {
  const pathname = usePathname();
  const { callState, callerName, isMuted, toggleMute, endCall, remoteStream, activeCallId } = useCall();
  const theme = useTheme();

  const isCallScreen = pathname.startsWith('/call/');
  const shouldShow = (callState === CALL_STATES.CONNECTED || callState === CALL_STATES.RINGING) && !isCallScreen;

  if (!shouldShow) return null;

  const handleMaximize = () => {
    if (activeCallId) {
      router.push({ pathname: '/(app)/call/[id]', params: { id: activeCallId } });
    }
  };

  return (
    <Pressable
      style={[styles.overlay, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      onPress={handleMaximize}
    >
      {remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.video} objectFit="cover" />
      ) : null}

      <View style={styles.controls}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.info}>
          {callerName}
        </ThemedText>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={toggleMute} hitSlop={8}>
            {isMuted ? <MicOff size={16} color="#fff" /> : <Mic size={16} color="#fff" />}
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: theme.danger }]} onPress={() => endCall()} hitSlop={8}>
            <PhoneOff size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.three,
    width: 140,
    height: 100,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: Spacing.one,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  info: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.one,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,120,128,0.4)',
  },
});
