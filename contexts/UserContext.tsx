import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

type User = { id: string; email?: string | null; name?: string | null } | null;

type Ctx = {
  user: User;
  loading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  signInEmail: (email: string, password: string, name?: string) => Promise<void>;
  registerEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInOAuth: (provider: "google" | "apple") => Promise<void>;
  skipAuth: () => void;
};

const UserContext = createContext<Ctx>({} as any);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      if (session?.user) setGuest(false);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const signInEmail = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user ? { id: data.user.id, email: data.user.email, name } : null);
    setGuest(false);
  };

  const registerEmail = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    setUser(data.user ? { id: data.user.id, email: data.user.email, name } : null);
    setGuest(false);
  };

  const signInOAuth = async (provider: "google" | "apple") => {
    WebBrowser.maybeCompleteAuthSession();
    const redirectTo = Linking.createURL("auth-callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider, options: { redirectTo, skipBrowserRedirect: true }
    });
    if (error) throw error;
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type === "success") {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      setGuest(false);
    }
  };

  const skipAuth = () => { setGuest(true); setUser({ id: "guest", email: null, name: "Гость" }); };

  const value = useMemo(() => ({
    user, loading, isGuest: guest || user?.id === "guest",
    signOut, signInEmail, registerEmail, signInOAuth, skipAuth
  }), [user, loading, guest]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
