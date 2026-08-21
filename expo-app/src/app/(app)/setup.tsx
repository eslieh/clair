import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { User as UserIcon } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { useProfile } from '@/hooks/use-profile';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SetupScreen() {
  const theme = useTheme();
  const { profile, isLoading } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading && !initialized && profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
      setInitialized(true);
    }
  }, [isLoading, initialized, profile]);

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
    } catch (err) {
      console.error('Error uploading image:', err);
      Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDone = async () => {
    if (!displayName || !username) {
      Alert.alert('Missing info', 'Display Name and Username are required');
      return;
    }

    setIsSaving(true);
    const result = await updateProfile({
      displayName,
      username: username.startsWith('@') ? username : `@${username}`,
      avatarUrl,
      status: profile?.status || '',
    });
    setIsSaving(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to save profile');
      return;
    }

    router.replace('/(app)/calls');
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
        <Pressable onPress={() => supabase.auth.signOut()}>
          <ThemedText themeColor="textSecondary">Sign Out</ThemedText>
        </Pressable>
        <Pressable onPress={handleDone} disabled={!displayName || !username || isSaving || isUploading}>
          <ThemedText type="smallBold" themeColor={isSaving ? 'textSecondary' : 'accent'}>
            {isSaving ? 'Saving…' : 'Done'}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.avatarSection}>
        <View style={[styles.avatarWrapper, { backgroundColor: theme.backgroundElement }]}>
          {isUploading ? (
            <ActivityIndicator color={theme.accent} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <UserIcon size={40} color={theme.textSecondary} />
          )}
        </View>
        <Pressable onPress={handlePickImage}>
          <ThemedText type="linkPrimary">{avatarUrl ? 'Edit Photo' : 'Add Photo'}</ThemedText>
        </Pressable>
      </View>

      <View style={styles.formSection}>
        <View style={[styles.field, { borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            Name
          </ThemedText>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display Name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
          />
        </View>
        <View style={[styles.field, { borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            Username
          </ThemedText>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            style={[styles.input, { color: theme.text }]}
          />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
          Your username and display name will be visible to your contacts in Clair.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: Spacing.four },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  avatarSection: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  formSection: { gap: Spacing.three },
  field: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  label: {},
  input: { fontSize: 17, paddingVertical: Spacing.one },
  footerText: { marginTop: Spacing.two },
});
