import { getApiBaseUrl } from "@/constants/api";
import type { AuthResponse, LoginInput, SignupInput, User } from "@/types/auth";
import type { CreateTaskInput, Task } from "@/types/task";
import * as FileSystem from "expo-file-system/legacy";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      `Cannot reach backend at ${baseUrl}. Run "npm run dev" in backend/.`,
      0,
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String(body.message)
        : "Request failed";
    const code =
      typeof body === "object" && body !== null && "code" in body
        ? String(body.code)
        : undefined;
    throw new ApiError(message, response.status, code);
  }

  return body as T;
}

async function uploadVoiceNote(audioUri: string, title?: string): Promise<Task> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();

  formData.append("audio", {
    uri: audioUri,
    name: "voice.m4a",
    type: "audio/mp4",
  } as unknown as Blob);

  if (title?.trim()) {
    formData.append("title", title.trim());
  }

  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/tasks/voice`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError(
      `Cannot reach backend at ${baseUrl}. Run "npm run dev" in backend/.`,
      0,
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String(body.message)
        : "Upload failed";
    throw new ApiError(message, response.status);
  }

  return body as Task;
}

async function downloadTaskAudio(taskId: string): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const localUri = `${FileSystem.cacheDirectory}task-audio-${taskId}.m4a`;
  const headers: Record<string, string> = {};

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const result = await FileSystem.downloadAsync(
    `${baseUrl}/api/tasks/${taskId}/audio`,
    localUri,
    { headers },
  );

  return result.uri;
}

export const api = {
  signup: (data: SignupInput) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: LoginInput) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ user: User }>("/api/auth/me"),
  getAuthConfig: () =>
    request<{ emailDelivery: "live" | "console" }>("/api/auth/config"),
  forgotPassword: (email: string) =>
    request<AuthResponse>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  verifyEmail: (email: string, otp: string) =>
    request<AuthResponse>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),
  resendVerification: (email: string) =>
    request<AuthResponse>("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  getTasks: () => request<Task[]>("/api/tasks"),
  getTask: (id: string) => request<Task>(`/api/tasks/${id}`),
  createTask: (data: CreateTaskInput) =>
    request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createTaskFromVoice: (audioUri: string, title?: string) =>
    uploadVoiceNote(audioUri, title),
  downloadTaskAudio: (taskId: string) => downloadTaskAudio(taskId),
  markTaskDone: (id: string) =>
    request<Task>(`/api/tasks/${id}/done`, {
      method: "PATCH",
    }),
};
