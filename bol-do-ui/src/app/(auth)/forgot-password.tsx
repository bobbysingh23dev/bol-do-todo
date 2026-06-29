import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth-button';
import { AuthField } from '@/components/auth-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Forgot password</ThemedText>
            <ThemedText themeColor="textSecondary">
              Enter your email and we will send a reset link.
            </ThemedText>
          </View>

          <AuthField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />

          {sent ? (
            <ThemedView type="backgroundElement" style={styles.notice}>
              <ThemedText>
                If that email exists, a reset link has been sent. Check your inbox or backend
                terminal in dev mode.
              </ThemedText>
            </ThemedView>
          ) : null}

          <AuthButton label="Send reset link" loading={loading} onPress={() => void handleSubmit()} />

          <Link href="/login" asChild>
            <Pressable style={styles.backLink}>
              <ThemedText type="linkPrimary">Back to login</ThemedText>
            </Pressable>
          </Link>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  notice: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
});
