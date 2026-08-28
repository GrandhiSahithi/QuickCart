import { createContext, useContext, useState } from "react";
import { accountApi, authApi } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "quickcart_token";
const USER_KEY = "quickcart_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  function persist(auth) {
    localStorage.setItem(TOKEN_KEY, auth.token);
    const persistedUser = { id: auth.id, name: auth.name, email: auth.email, premium: auth.premium, role: auth.role };
    localStorage.setItem(USER_KEY, JSON.stringify(persistedUser));
    setUser(persistedUser);
  }

  // Password check only - returns an OTP challenge, no session yet.
  async function login(email, password) {
    return authApi.login({ email, password });
  }

  async function verifyOtp(email, code) {
    const auth = await authApi.verifyOtp({ email, code });
    persist(auth);
    return auth;
  }

  function resendOtp(email) {
    return authApi.resendOtp({ email });
  }

  function forgotPassword(email) {
    return authApi.forgotPassword({ email });
  }

  async function resetPassword(email, code, newPassword) {
    const auth = await authApi.resetPassword({ email, code, newPassword });
    persist(auth);
    return auth;
  }

  async function signup(name, email, password) {
    const auth = await authApi.signup({ name, email, password });
    persist(auth);
    return auth;
  }

  async function adminSignup(name, email, password) {
    const auth = await authApi.adminSignup({ name, email, password });
    persist(auth);
    return auth;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  async function refreshUser() {
    const info = await accountApi.me();
    setUser((prev) => {
      const updated = { ...prev, ...info };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <AuthContext.Provider
      value={{ user, login, verifyOtp, resendOtp, forgotPassword, resetPassword, signup, adminSignup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
