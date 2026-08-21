import { useCallback, useState } from 'react';
import { Image, Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { PhoneMissed, User as UserIcon, Video } from 'lucide-react-native';

import { getCallHistory, type CallHistoryItem } from '@/lib/api';
import { useProfile } from '@/hooks/use-profile';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Section = { title: string; data: CallHistoryItem[] };

function groupCallsByDate(calls: CallHistoryItem[]): Section[] {
  const groups: Record<'today' | 'yesterday' | 'lastWeek' | 'older', CallHistoryItem[]> = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: [],
  };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  calls.forEach((call) => {
    const date = new Date(call.date);
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const isLastWeek = today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000;

    if (isToday) groups.today.push(call);
    else if (isYesterday) groups.yesterday.push(call);
    else if (isLastWeek) groups.lastWeek.push(call);
    else groups.older.push(call);
  });

  const sections: Section[] = [];
  if (groups.today.length) sections.push({ title: 'Today', data: groups.today });
  if (groups.yesterday.length) sections.push({ title: 'Yesterday', data: groups.yesterday });
  if (groups.lastWeek.length) sections.push({ title: 'Last Week', data: groups.lastWeek });
  if (groups.older.length) sections.push({ title: 'Older', data: groups.older });
  return sections;
}

export default function CallsScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  const [sections, setSections] = useState<Section[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const calls = await getCallHistory();
    setSections(groupCallsByDate(calls));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Calls</ThemedText>
        <Pressable onPress={() => router.push('/(app)/account')} hitSlop={8}>
          <View style={[styles.accountAvatar, { backgroundColor: theme.backgroundElement }]}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.accountAvatarImg} />
            ) : (
              <UserIcon size={18} color={theme.textSecondary} />
            )}
          </View>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        renderSectionHeader={({ section }) => (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            {section.title}
          </ThemedText>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary">No calls yet. Start one below.</ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, { borderColor: theme.border }]}
            onPress={() =>
              router.push({
                pathname: '/(app)/call-detail',
                params: {
                  otherId: item.other?.id || '',
                  otherName: item.other?.display_name || 'Unknown',
                  otherUsername: item.other?.username || '',
                  otherAvatar: item.other?.avatar_url || '',
                  status: item.status,
                  rawStatus: item.rawStatus,
                  date: item.date,
                  direction: item.direction,
                },
              })
            }
          >
            <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
              {item.other?.avatar_url ? (
                <Image source={{ uri: item.other.avatar_url }} style={styles.avatarImg} />
              ) : (
                <ThemedText type="smallBold">{(item.other?.display_name || '?')[0]?.toUpperCase()}</ThemedText>
              )}
            </View>
            <View style={styles.rowText}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {item.other?.display_name || 'Unknown'}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor={item.rawStatus === 'missed' ? 'danger' : 'textSecondary'}
                numberOfLines={1}
              >
                {item.direction === 'inbound' ? 'Incoming' : 'Outgoing'} · {item.status}
              </ThemedText>
            </View>
            {item.rawStatus === 'missed' ? (
              <PhoneMissed size={18} color={theme.danger} />
            ) : (
              <Video size={18} color={theme.textSecondary} />
            )}
          </Pressable>
        )}
      />

      <Pressable
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => router.push('/(app)/new-call')}
      >
        <Video size={22} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accountAvatarImg: { width: '100%', height: '100%' },
  listContent: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six * 2, flexGrow: 1 },
  sectionHeader: { paddingVertical: Spacing.two },
  empty: { paddingTop: Spacing.six, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  rowText: { flex: 1, gap: 2 },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
