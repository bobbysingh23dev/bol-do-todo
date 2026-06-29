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
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        Alert.alert("Email not verified", "Check Mailinator or verify in app.", [
          {
            text: "Verify now",
            onPress: () =>
              router.push({
                pathname: "/verify-email",
                params: { email: email.trim().toLowerCase() },
              }),
          },
          { text: "OK" },
        ]);
      } else {
        Alert.alert(
          "Login failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">BolDo</ThemedText>
            <ThemedText themeColor="textSecondary">
              Speak your work. BolDo organizes it.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              API: {getApiBaseUrl()}
            </ThemedText>
          </View>

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
            placeholder="Your password"
          />

          <Link href="/forgot-password" asChild>
            <Pressable>
              <ThemedText type="linkPrimary">Forgot password?</ThemedText>
            </Pressable>
          </Link>

          <AuthButton
            label="Log in"
            loading={loading}
            onPress={() => void handleLogin()}
          />

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary">New here?</ThemedText>
            <Link href="/signup" asChild>
              <Pressable>
                <ThemedText type="linkPrimary">Create account</ThemedText>
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
