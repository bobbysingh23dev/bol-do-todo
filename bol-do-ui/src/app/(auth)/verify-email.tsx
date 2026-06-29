import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthButton } from "@/components/auth-button";
import { AuthField } from "@/components/auth-field";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getApiBaseUrl } from "@/constants/api";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

function normalizeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getMailinatorUrl(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.endsWith("@mailinator.com")) {
    return null;
  }

  const inbox = trimmed.split("@")[0];
  if (!inbox) {
    return null;
  }

  return `https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`;
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const params = useLocalSearchParams<{
    otp?: string | string[];
    email?: string | string[];
  }>();
  const initialOtp = normalizeParam(params.otp);
  const initialEmail = normalizeParam(params.email);

  const [otp, setOtp] = useState(initialOtp);
  const [email, setEmail] = useState(initialEmail);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailDelivery, setEmailDelivery] = useState<"live" | "console" | null>(
    null,
  );
  const [status, setStatus] = useState<string | null>(null);
  const autoVerifyAttempted = useRef(false);

  const mailinatorUrl = getMailinatorUrl(email);
  const devMode = emailDelivery === "console" && Boolean(otp.trim());

  const verify = async (rawOtp: string) => {
    const trimmedOtp = rawOtp.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert("Missing email", "Enter the email you signed up with.");
      return;
    }

    if (!/^\d{6}$/.test(trimmedOtp)) {
      Alert.alert("Invalid code", "Enter the 6-digit code from your email.");
      return;
    }

    setVerifying(true);
    setStatus(null);

    try {
      const response = await api.verifyEmail(trimmedEmail, trimmedOtp);

      if (response.token && response.user) {
        await setSession(response.token, response.user);
        router.replace("/(tabs)");
        return;
      }

      setStatus(response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus(message);
      Alert.alert("Verification failed", message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Enter your email address.");
      return;
    }

    setResending(true);
    setStatus(null);

    try {
      const response = await api.resendVerification(email.trim().toLowerCase());

      if (response.devOtp) {
        setOtp(response.devOtp);
        setStatus("Dev OTP filled in. Tap Verify email.");
      } else if (response.message === "Email is already verified") {
        setStatus("Already verified — try logging in.");
      } else {
        const inbox = getMailinatorUrl(email);
        setStatus(
          inbox
            ? `Code sent. Open Mailinator inbox "${email.split("@")[0]}".`
            : response.message,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus(message);
      Alert.alert("Resend failed", message);
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    void api
      .getAuthConfig()
      .then((config) => setEmailDelivery(config.emailDelivery))
      .catch(() => setEmailDelivery("console"));
  }, []);

  useEffect(() => {
    if (
      initialOtp &&
      initialEmail &&
      !autoVerifyAttempted.current &&
      emailDelivery === "console"
    ) {
      autoVerifyAttempted.current = true;
      void verify(initialOtp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailDelivery]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Verify email</ThemedText>
            <ThemedText themeColor="textSecondary">
              Enter the 6-digit code sent to your email.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              API: {getApiBaseUrl()}
            </ThemedText>

            {emailDelivery === "live" ? (
              <ThemedView type="backgroundElement" style={styles.banner}>
                <ThemedText type="smallBold">Check your inbox</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Copy the 6-digit code from the verification email.
                </ThemedText>
                {mailinatorUrl ? (
                  <Pressable onPress={() => void Linking.openURL(mailinatorUrl)}>
                    <ThemedText type="linkPrimary">
                      Open {email.split("@")[0] || "inbox"} inbox
                    </ThemedText>
                  </Pressable>
                ) : null}
              </ThemedView>
            ) : devMode ? (
              <ThemedView type="backgroundElement" style={styles.banner}>
                <ThemedText type="smallBold">Dev mode</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  OTP auto-filled (no SMTP). For Mailinator: run npm run setup:email
                  in backend, add Brevo SMTP, restart server.
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedText themeColor="textSecondary">
                Tap Resend for dev OTP, or configure Brevo SMTP for Mailinator delivery.
              </ThemedText>
            )}

            {status ? (
              <ThemedText type="small" themeColor="textSecondary">
                {status}
              </ThemedText>
            ) : null}
          </View>

          <AuthField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />
          <AuthField
            label="Verification code"
            autoCapitalize="none"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            placeholder="123456"
          />

          <AuthButton
            label="Verify email"
            loading={verifying}
            onPress={() => void verify(otp)}
          />
          <AuthButton
            label="Resend code"
            variant="secondary"
            loading={resending}
            onPress={() => void handleResend()}
          />

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
  banner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  backLink: {
    alignSelf: "center",
    marginTop: Spacing.two,
  },
});
