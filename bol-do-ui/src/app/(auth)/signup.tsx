import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthButton } from "@/components/auth-button";
import { AuthField } from "@/components/auth-field";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getApiBaseUrl } from "@/constants/api";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await signup({
        name: name.trim(),
        email: normalizedEmail,
        password,
      });

      router.replace({
        pathname: "/verify-email",
        params: {
          email: normalizedEmail,
          ...(response.devOtp && { otp: response.devOtp }),
        },
      });
    } catch (error) {
      Alert.alert(
        "Signup failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Create account</ThemedText>
            <ThemedText themeColor="textSecondary">
              Use any @mailinator.com address — OTP arrives in the public inbox
              once Brevo SMTP is configured on the backend.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              API: {getApiBaseUrl()}
            </ThemedText>
          </View>

          <AuthField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Bobby"
          />
          <AuthField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="waterfall@mailinator.com"
          />
          <AuthField
            label="Password"
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

          <AuthButton
            label="Sign up"
            loading={loading}
            onPress={() => void handleSignup()}
          />

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">
              Already have an account?
            </ThemedText>
            <Link href="/login" asChild>
              <Pressable>
                <ThemedText type="linkPrimary">Log in</ThemedText>
              </Pressable>
            </Link>
          </View>
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
    width: "100%",
    alignSelf: "center",
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.one,
    justifyContent: "center",
    marginTop: Spacing.two,
  },
});
