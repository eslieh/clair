import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LogOut, User as UserIcon, X } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { useProfile } from '@/hooks/use-profile';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AccountScreen() {
  const theme = useTheme();
  const { profile, isLoading } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setStatus(profile.status || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(result.assets[0]);
      if (url) setAvatarUrl(url);
      else Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProfile({ displayName, username, status, avatarUrl });
    setIsSaving(false);

    if (result.error) {
      Alert.alert('Error', result.error);
      return;
    }
    router.back();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Account</ThemedText>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.avatarSection}>
        <Pressable onPress={handlePickImage} style={[styles.avatarLarge, { backgroundColor: theme.backgroundElement }]}>
          {isUploading ? (
            <ActivityIndicator color={theme.accent} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <UserIcon size={40} color={theme.textSecondary} />
          )}
        </Pressable>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display Name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.nameInput, { color: theme.text }]}
        />
      </View>

      <View style={[styles.field, { borderColor: theme.border }]}>
        <ThemedText themeColor="textSecondary" style={styles.detailLabel}>
          username
        </ThemedText>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="@username"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          style={[styles.detailInput, { color: theme.text }]}
        />
      </View>
      <View style={[styles.field, { borderColor: theme.border }]}>
        <ThemedText themeColor="textSecondary" style={styles.detailLabel}>
          status
        </ThemedText>
        <TextInput
          value={status}
          onChangeText={setStatus}
          placeholder="What's on your mind?"
          placeholderTextColor={theme.textSecondary}
          style={[styles.detailInput, { color: theme.text }]}
        />
      </View>

      <Pressable
        style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: isSaving || isUploading ? 0.7 : 1 }]}
        onPress={handleSave}
        disabled={isSaving || isUploading}
      >
        <ThemedText type="smallBold" style={styles.saveBtnText}>
          {isSaving ? 'Saving…' : 'Save Changes'}
        </ThemedText>
      </Pressable>

      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <LogOut size={18} color={theme.danger} />
        <ThemedText type="smallBold" themeColor="danger">
          Sign Out
        </ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: Spacing.four },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.four },
  avatarSection: { alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.four },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  nameInput: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  field: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  detailLabel: { textTransform: 'uppercase', fontSize: 12 },
  detailInput: { fontSize: 16, paddingVertical: Spacing.one },
  saveBtn: {
    height: 50,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  saveBtnText: { color: '#fff' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    height: 50,
  },
});
