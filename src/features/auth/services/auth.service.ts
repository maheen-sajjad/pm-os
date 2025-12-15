import { LoginCredentials, RegisterCredentials, AuthResponse } from "../types";

const API_BASE = "/api/auth";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return response.json();
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    return response.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/logout`, { method: "POST" });
  },

  async getCurrentUser(): Promise<AuthResponse | null> {
    const response = await fetch(`${API_BASE}/me`);
    if (!response.ok) return null;
    return response.json();
  },
};
