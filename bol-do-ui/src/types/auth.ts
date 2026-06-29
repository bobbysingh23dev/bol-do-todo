export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

export type AuthResponse = {
  message: string;
  token?: string;
  user?: User;
  code?: string;
  devOtp?: string;
  devResetToken?: string;
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
