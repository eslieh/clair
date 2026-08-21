import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Phone, PhoneOff } from 'lucide-react-native';

import { useCall } from '@/contexts/CallContext';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Ringer() {
  const { incomingCall, acceptCall, declineCall } = useCall();
  const theme = useTheme();
  const player = useAudioPlayer(require('@/assets/sounds/apple_ring.mp3'));

  useEffect(() => {
    player.loop = true;
    if (incomingCall) {
      player.seekTo(0);
      player.play();
    } else {
      player.pause();
    }
    return () => player.pause();
  }, [incomingCall, player]);

  if (!incomingCall) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.avatar}>
        {incomingCall.avatar_url ? (
          <Image source={{ uri: incomingCall.avatar_url }} style={styles.avatarImg} />
        ) : (
          <ThemedText type="subtitle">{(incomingCall.name?.[0] || 'C').toUpperCase()}</ThemedText>
        )}
      </View>

      <View style={styles.content}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {incomingCall.name || 'Incoming Call'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Clair Video…
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.roundBtn, { backgroundColor: theme.danger }]} onPress={declineCall}>
          <PhoneOff size={20} color="#fff" fill="#fff" />
        </Pressable>
        <Pressable style={[styles.roundBtn, { backgroundColor: theme.success }]} onPress={acceptCall}>
          <Phone size={20} color="#fff" fill="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 60,
    left: Spacing.three,
    right: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(120,120,128,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
