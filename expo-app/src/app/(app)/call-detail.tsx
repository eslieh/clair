import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { User as UserIcon, Video, X } from 'lucide-react-native';

import { useCall } from '@/contexts/CallContext';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CallDetailScreen() {
  const theme = useTheme();
  const { startCall } = useCall();
  const params = useLocalSearchParams<{
    otherId: string;
    otherName: string;
    otherUsername: string;
    otherAvatar: string;
    status: string;
    date: string;
    direction: string;
  }>();

  const handleCall = () => {
    if (!params.otherId) return;
    startCall(params.otherId, params.otherName);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.profile}>
        <View style={[styles.avatarLarge, { backgroundColor: theme.backgroundElement }]}>
          {params.otherAvatar ? (
            <Image source={{ uri: params.otherAvatar }} style={styles.avatarImg} />
          ) : (
            <UserIcon size={40} color={theme.textSecondary} />
          )}
        </View>
        <ThemedText type="subtitle">{params.otherName || 'Unknown'}</ThemedText>
        {params.otherUsername ? (
          <ThemedText themeColor="textSecondary">@{params.otherUsername}</ThemedText>
        ) : null}
      </View>

      <Pressable style={[styles.callBtn, { backgroundColor: theme.accent }]} onPress={handleCall}>
        <Video size={20} color="#fff" />
        <ThemedText type="smallBold" style={styles.callBtnText}>
          Start Video Call
        </ThemedText>
      </Pressable>

      <View style={[styles.details, { borderColor: theme.border }]}>
        <View style={styles.detailRow}>
          <ThemedText themeColor="textSecondary">Last call</ThemedText>
          <ThemedText>{params.date ? new Date(params.date).toLocaleString() : '-'}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText themeColor="textSecondary">Direction</ThemedText>
          <ThemedText style={styles.capitalize}>{params.direction}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText themeColor="textSecondary">Status</ThemedText>
          <ThemedText>{params.status}</ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: Spacing.four },
  header: { alignItems: 'flex-end' },
  profile: { alignItems: 'center', gap: Spacing.one, marginTop: Spacing.two, marginBottom: Spacing.four },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  avatarImg: { width: '100%', height: '100%' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 50,
    borderRadius: Spacing.two,
    marginBottom: Spacing.four,
  },
  callBtnText: { color: '#fff' },
  details: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  capitalize: { textTransform: 'capitalize' },
});
