import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth-button';
import { AuthField } from '@/components/auth-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(tokenParam ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!token.trim()) {
      Alert.alert('Missing token', 'Paste the reset token from your email.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token.trim(), password);
      Alert.alert('Password updated', 'You can now log in with your new password.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (error) {
      Alert.alert('Reset failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Reset password</ThemedText>
            <ThemedText themeColor="textSecondary">
              Paste the token from your reset email, then choose a new password.
            </ThemedText>
          </View>

          <AuthField
            label="Reset token"
            autoCapitalize="none"
            value={token}
            onChangeText={setToken}
            placeholder="Token from email"
          />
          <AuthField
            label="New password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
          />
          <AuthField
            label="Confirm password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
          />

          <AuthButton label="Update password" loading={loading} onPress={() => void handleReset()} />

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
  backLink: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
});
