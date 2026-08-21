import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, User as UserIcon, UserPlus, X } from 'lucide-react-native';

import { addContact, getContacts, searchUsers } from '@/lib/api';
import { useCall } from '@/contexts/CallContext';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PersonRow = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
};

export default function NewCallScreen() {
  const theme = useTheme();
  const { startCall } = useCall();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonRow[]>([]);
  const [contacts, setContacts] = useState<PersonRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  useEffect(() => {
    if (query.length < 2) return;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const users = await searchUsers(query);
      setResults(users as PersonRow[]);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleStartCall = (user: PersonRow) => {
    router.back();
    startCall(user.id, user.display_name);
  };

  const handleAddContact = async (user: PersonRow) => {
    await addContact(user.id);
    setContacts((prev) => [...prev, user]);
  };

  const isContact = (id: string) => contacts.some((c) => c.id === id);
  const displayList = query.length >= 2 ? results : contacts;
  const listTitle = query.length >= 2 ? 'Search Results' : 'Suggested';

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">New Clair Call</ThemedText>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.searchWrap, { borderColor: theme.border }]}>
        <Search size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or username"
          placeholderTextColor={theme.textSecondary}
          autoFocus
          autoCapitalize="none"
          style={[styles.input, { color: theme.text }]}
        />
        {isSearching ? <ActivityIndicator size="small" color={theme.textSecondary} /> : null}
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.listTitle}>
        {listTitle}
      </ThemedText>

      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            {query.length < 2 && contacts.length === 0 ? 'No contacts yet. Search to add someone!' : 'No people found.'}
          </ThemedText>
        }
        renderItem={({ item }) => (
          <Pressable style={[styles.row, { borderColor: theme.border }]} onPress={() => handleStartCall(item)}>
            <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
              ) : (
                <UserIcon size={20} color={theme.textSecondary} />
              )}
            </View>
            <ThemedText type="smallBold" style={styles.rowText} numberOfLines={1}>
              {item.display_name}
            </ThemedText>
            {!isContact(item.id) ? (
              <Pressable onPress={() => handleAddContact(item)} hitSlop={8}>
                <UserPlus size={18} color={theme.accent} />
              </Pressable>
            ) : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: Spacing.four },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 44,
    marginBottom: Spacing.three,
  },
  input: { flex: 1, fontSize: 16 },
  listTitle: { marginBottom: Spacing.two },
  listContent: { paddingBottom: Spacing.six },
  empty: { textAlign: 'center', marginTop: Spacing.five },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  rowText: { flex: 1 },
});
