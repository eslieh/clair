import { useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react-native';
import { RTCView } from 'react-native-webrtc';

import { CALL_STATES, useCall } from '@/contexts/CallContext';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CallScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    id: string;
    initiator?: string;
    callee?: string;
    name?: string;
    avatar?: string;
  }>();

  const {
    callState,
    startCall,
    endCall,
    isMuted,
    toggleMute,
    isVideoOff,
    toggleVideo,
    localStream,
    remoteStream,
    callDuration,
    callerName,
    activeCallId,
  } = useCall();

  const hasAttempted = useRef(false);
  const dialingPlayer = useAudioPlayer(require('@/assets/sounds/dialing.mp3'));
  const unavailablePlayer = useAudioPlayer(require('@/assets/sounds/unavailable.mp3'));

  useEffect(() => {
    dialingPlayer.loop = true;
    if (callState === CALL_STATES.DIALING || callState === CALL_STATES.RINGING) {
      dialingPlayer.seekTo(0);
      dialingPlayer.play();
      unavailablePlayer.pause();
    } else if (callState === CALL_STATES.UNAVAILABLE) {
      dialingPlayer.pause();
      unavailablePlayer.seekTo(0);
      unavailablePlayer.play();
    } else {
      dialingPlayer.pause();
      unavailablePlayer.pause();
    }
    return () => {
      dialingPlayer.pause();
      unavailablePlayer.pause();
    };
  }, [callState, dialingPlayer, unavailablePlayer]);

  useEffect(() => {
    if (hasAttempted.current) return;
    if (callState === CALL_STATES.ENDED || callState === CALL_STATES.DECLINED || callState === CALL_STATES.UNAVAILABLE) return;

    const isInitiator = params.initiator === 'true';
    if (isInitiator && params.callee && (callState === CALL_STATES.IDLE || activeCallId !== params.id)) {
      hasAttempted.current = true;
      startCall(params.callee, params.name || 'User', params.id);
    }
  }, [params.id, params.initiator, params.callee, params.name, callState, activeCallId, startCall]);

  useEffect(() => {
    if (callState === CALL_STATES.ENDED || callState === CALL_STATES.DECLINED || callState === CALL_STATES.UNAVAILABLE) {
      const waitTime = callState === CALL_STATES.UNAVAILABLE ? 6000 : 2000;
      const timer = setTimeout(() => {
        router.replace('/(app)/calls');
      }, waitTime);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  const handleEndCall = () => endCall();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderCallStatus = () => {
    switch (callState) {
      case CALL_STATES.DIALING:
        return 'Dialing…';
      case CALL_STATES.RINGING:
        return 'Ringing…';
      case CALL_STATES.CONNECTING:
        return 'Connecting…';
      case CALL_STATES.UNAVAILABLE:
        return 'Recipient is unavailable';
      case CALL_STATES.DECLINED:
        return 'Declined';
      case CALL_STATES.ENDED:
        return 'Call ended';
      default:
        return formatDuration(callDuration);
    }
  };

  const isConnected = callState === CALL_STATES.CONNECTED;
  const avatar = params.avatar;

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {isConnected && remoteStream ? (
          <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
        ) : (
          <View style={[styles.statusOverlay, { backgroundColor: theme.background }]}>
            <View style={[styles.callerAvatar, { backgroundColor: theme.backgroundElement }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <ThemedText type="title">{(callerName || 'U').charAt(0).toUpperCase()}</ThemedText>
              )}
            </View>
            <ThemedText type="title" style={styles.callerName}>
              {callerName}
            </ThemedText>
            <ThemedText themeColor="textSecondary">{renderCallStatus()}</ThemedText>
          </View>
        )}
      </View>

      {isConnected ? (
        <View style={styles.localVideoContainer}>
          {localStream && !isVideoOff ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror
              zOrder={1}
            />
          ) : (
            <View style={[styles.localVideo, styles.videoOffOverlay, { backgroundColor: theme.backgroundElement }]}>
              <VideoOff size={24} color="#fff" />
            </View>
          )}
        </View>
      ) : null}

      <SafeAreaView edges={['bottom']} style={styles.callControls}>
        <View style={styles.callInfo}>
          <ThemedText type="smallBold" style={styles.whiteText}>
            {callerName}
          </ThemedText>
          <ThemedText type="small" style={styles.whiteTextSecondary}>
            {renderCallStatus()}
          </ThemedText>
        </View>

        <View style={styles.controlButtons}>
          <Pressable
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            {isMuted ? <MicOff size={24} color="#000" /> : <Mic size={24} color="#fff" />}
          </Pressable>

          <Pressable
            style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
            onPress={toggleVideo}
          >
            {isVideoOff ? <VideoOff size={24} color="#000" /> : <Video size={24} color="#fff" />}
          </Pressable>

          <Pressable style={[styles.controlButton, { backgroundColor: theme.danger }]} onPress={handleEndCall}>
            <PhoneOff size={24} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoContainer: { flex: 1 },
  remoteVideo: { flex: 1 },
  statusOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  callerAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  avatarImg: { width: '100%', height: '100%' },
  callerName: { textAlign: 'center' },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: Spacing.three,
    width: 100,
    height: 140,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  localVideo: { width: '100%', height: '100%' },
  videoOffOverlay: { alignItems: 'center', justifyContent: 'center' },
  callControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.four,
    alignItems: 'center',
  },
  callInfo: { alignItems: 'center', gap: 2 },
  whiteText: { color: '#fff' },
  whiteTextSecondary: { color: 'rgba(255,255,255,0.7)' },
  controlButtons: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,120,128,0.32)',
  },
  controlButtonActive: {
    backgroundColor: '#fff',
  },
});
