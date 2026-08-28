import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "quickcart_token";
const USER_KEY = "quickcart_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function persist(auth) {
    const persistedUser = { id: auth.id, name: auth.name, email: auth.email };
    await AsyncStorage.setItem(TOKEN_KEY, auth.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(persistedUser));
    setUser(persistedUser);
  }

  // Password check only - returns an OTP challenge, no session yet.
  async function login(email, password) {
    return authApi.login({ email, password });
  }

  async function verifyOtp(email, code) {
    const auth = await authApi.verifyOtp({ email, code });
    await persist(auth);
    return auth;
  }

  function resendOtp(email) {
    return authApi.resendOtp({ email });
  }

  async function signup(name, email, password) {
    const auth = await authApi.signup({ name, email, password });
    await persist(auth);
  }

  async function logout() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, resendOtp, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
