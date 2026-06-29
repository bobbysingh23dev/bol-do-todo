import Constants from "expo-constants";
import { Platform } from "react-native";

function getMetroHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(":")[0];
  return host || null;
}

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (Platform.OS === "web") {
    return "http://localhost:4000";
  }

  const metroHost = getMetroHost();

  if (Platform.OS === "android") {
    if (metroHost && metroHost !== "localhost") {
      return `http://${metroHost}:4000`;
    }
    return "http://10.0.2.2:4000";
  }

  if (metroHost) {
    return `http://${metroHost}:4000`;
  }

  return "http://localhost:4000";
}
