import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  joinDate: string;
  avatar: string;
  subscription: "free" | "pro" | "enterprise";
  threatsBlocked: number;
  scansCompleted: number;
  uptimeHours: number;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateSubscription: (plan: "free" | "pro" | "enterprise") => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  incrementStats: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "@genzex_users";
const SESSION_KEY = "@genzex_session";

const AVATAR_OPTIONS = [
  "shield-account",
  "robot",
  "alien",
  "ninja",
  "face-agent",
  "account-cowboy-hat",
  "incognito",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const usersData = await AsyncStorage.getItem(USERS_KEY);
        if (usersData) {
          const users = JSON.parse(usersData);
          const foundUser = users.find((u: any) => u.id === session.userId);
          if (foundUser) {
            setUser(foundUser);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsers = async (): Promise<any[]> => {
    const data = await AsyncStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveUsers = async (users: any[]) => {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      const users = await getUsers();
      const found = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
      if (!found) {
        return { success: false, error: "User not found" };
      }
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password + found.salt);
      if (hash !== found.passwordHash) {
        return { success: false, error: "Invalid password" };
      }
      const profile: UserProfile = {
        id: found.id,
        username: found.username,
        displayName: found.displayName,
        email: found.email,
        joinDate: found.joinDate,
        avatar: found.avatar,
        subscription: found.subscription,
        threatsBlocked: found.threatsBlocked || 0,
        scansCompleted: found.scansCompleted || 0,
        uptimeHours: found.uptimeHours || 0,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: found.id }));
      setUser(profile);
      return { success: true };
    } catch (e) {
      return { success: false, error: "Login failed" };
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, displayName: string) => {
    try {
      const users = await getUsers();
      if (users.find((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, error: "Username already exists" };
      }
      if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: "Email already registered" };
      }
      const id = Crypto.randomUUID();
      const salt = Crypto.randomUUID();
      const passwordHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password + salt);
      const avatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      const newUser = {
        id,
        username,
        displayName,
        email,
        passwordHash,
        salt,
        joinDate: new Date().toISOString(),
        avatar,
        subscription: "free" as const,
        threatsBlocked: Math.floor(Math.random() * 500) + 100,
        scansCompleted: Math.floor(Math.random() * 2000) + 500,
        uptimeHours: Math.floor(Math.random() * 200) + 50,
      };
      users.push(newUser);
      await saveUsers(users);
      const profile: UserProfile = {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        email: newUser.email,
        joinDate: newUser.joinDate,
        avatar: newUser.avatar,
        subscription: newUser.subscription,
        threatsBlocked: newUser.threatsBlocked,
        scansCompleted: newUser.scansCompleted,
        uptimeHours: newUser.uptimeHours,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: newUser.id }));
      setUser(profile);
      return { success: true };
    } catch (e) {
      return { success: false, error: "Registration failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const updateSubscription = useCallback(async (plan: "free" | "pro" | "enterprise") => {
    if (!user) return;
    const users = await getUsers();
    const idx = users.findIndex((u: any) => u.id === user.id);
    if (idx >= 0) {
      users[idx].subscription = plan;
      await saveUsers(users);
      setUser((prev) => prev ? { ...prev, subscription: plan } : null);
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const users = await getUsers();
    const idx = users.findIndex((u: any) => u.id === user.id);
    if (idx >= 0) {
      Object.assign(users[idx], updates);
      await saveUsers(users);
      setUser((prev) => prev ? { ...prev, ...updates } : null);
    }
  }, [user]);

  const incrementStats = useCallback(() => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        scansCompleted: prev.scansCompleted + 1,
        threatsBlocked: prev.threatsBlocked + (Math.random() > 0.7 ? 1 : 0),
      };
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    register,
    logout,
    updateSubscription,
    updateProfile,
    incrementStats,
  }), [user, isLoading, login, register, logout, updateSubscription, updateProfile, incrementStats]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
