import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy =
    mode === 'signin'
      ? { title: 'Welcome back', subtitle: 'Sign in to pick up your next call.', primary: 'Sign in' }
      : { title: 'Create your account', subtitle: "Start calling with next-gen P2P video.", primary: 'Create account' };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const { error: authError } =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, display_name: name } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
    }
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText type="title">Clair</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.tagline}>
              A peer-to-peer video chat built for presence: fast, clear, and designed to feel human.
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="subtitle">{copy.title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.cardSubtitle}>
              {copy.subtitle}
            </ThemedText>

            {error ? (
              <ThemedText themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}

            {mode === 'signup' ? (
              <View style={styles.field}>
                <ThemedText type="small" themeColor="textSecondary">
                  Name
                </ThemedText>
                <View style={[styles.inputWrap, { borderColor: theme.border }]}>
                  <User size={18} color={theme.textSecondary} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={theme.textSecondary}
                    autoComplete="name"
                    style={[styles.input, { color: theme.text }]}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">
                Email
              </ThemedText>
              <View style={[styles.inputWrap, { borderColor: theme.border }]}>
                <Mail size={18} color={theme.textSecondary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@domain.com"
                  placeholderTextColor={theme.textSecondary}
                  autoComplete="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.text }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText type="small" themeColor="textSecondary">
                Password
              </ThemedText>
              <View style={[styles.inputWrap, { borderColor: theme.border }]}>
                <Lock size={18} color={theme.textSecondary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPassword}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  style={[styles.input, { color: theme.text }]}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff size={18} color={theme.textSecondary} />
                  ) : (
                    <Eye size={18} color={theme.textSecondary} />
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.submit, { backgroundColor: theme.accent, opacity: isSubmitting ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={isSubmitting || !email || password.length < 8 || (mode === 'signup' && !name)}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="smallBold" style={styles.submitText}>
                  {copy.primary}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={styles.toggleRow}
              onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            >
              <ThemedText type="small" themeColor="textSecondary">
                {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
              </ThemedText>
              <ThemedText type="linkPrimary">{mode === 'signin' ? 'Create an account' : 'Sign in'}</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.five,
  },
  header: {
    gap: Spacing.two,
  },
  tagline: {
    maxWidth: 320,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardSubtitle: {
    marginTop: -Spacing.two,
  },
  error: {
    textAlign: 'center',
  },
  field: {
    gap: Spacing.one,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  submit: {
    height: 50,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  submitText: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
});
