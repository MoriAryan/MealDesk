export type AuthUser = {
  id: string;
  role: "admin" | "cashier" | "kitchen" | string;
  email: string;
  name?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};
