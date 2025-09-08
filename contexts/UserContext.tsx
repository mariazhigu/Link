import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import supabase from '../lib/supabase'; // должен существовать; если не настроен — будет работать "Пропустить вход"

type UserShape = { id: string; email?: string | null; name?: string | null } | null;

type Ctx = {
  loading: boolean;
  user: UserShape;
  // то, что ждёт твой экран:
  signInEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (email: string, password: string, name?: string) => Promise<void>;
  skipAuth: () => Promise<void>;
  signOut: () => Promise<void>;
};

const CtxRef = createContext<Ctx | undefined>(undefined);
export const useUser = () => {
  const v = useContext(CtxRef);
  if (!v) throw new Error('useUser must be used within UserProvider');
  return v;
};

const GUEST_KEY = 'linkpro-guest-session';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserShape>(null);
  const [loading, setLoading] = useState(true);

  // загрузка/подписка на сессию
  useEffect(() => {
    (async () => {
      try {
        if (supabase?.auth) {
          const { data } = await supabase.auth.getSession();
          const u = data?.session?.user;
          if (u) setUser({ id: u.id, email: u.email, name: (u.user_metadata as any)?.name ?? null });

          supabase.auth.onAuthStateChange((_event, session) => {
            const su = session?.user;
            setUser(su ? { id: su.id, email: su.email, name: (su.user_metadata as any)?.name ?? null } : null);
          });
        }
        if (!user) {
          const guest = await AsyncStorage.getItem(GUEST_KEY);
          if (guest === '1') setUser({ id: 'guest' });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    if (!supabase?.auth) {
      Alert.alert('Вход недоступен', 'Supabase не настроен. Используйте «Пропустить».');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return Alert.alert('Ошибка входа', error.message);
    if (data?.user) {
      await AsyncStorage.removeItem(GUEST_KEY);
      setUser({ id: data.user.id, email: data.user.email, name: (data.user.user_metadata as any)?.name ?? null });
    }
  }, []);

  const registerEmail = useCallback(async (email: string, password: string, name?: string) => {
    if (!supabase?.auth) {
      Alert.alert('Регистрация недоступна', 'Supabase не настроен. Используйте «Пропустить».');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: name || '' } },
    } as any); // типизация supabase-js v2
    setLoading(false);
    if (error) return Alert.alert('Ошибка регистрации', error.message);
    // В некоторых проектах почта требует подтверждения — тогда user может быть null.
    if (data?.user) {
      await AsyncStorage.removeItem(GUEST_KEY);
      setUser({ id: data.user.id, email: data.user.email, name: (data.user.user_metadata as any)?.name ?? name ?? null });
    } else {
      Alert.alert('Проверь почту', 'Подтверди адрес, затем войди.');
    }
  }, []);

  const skipAuth = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_KEY, '1');
    setUser({ id: 'guest' });
  }, []);

  const signOut = useCallback(async () => {
    try { await supabase?.auth?.signOut(); } catch {}
    await AsyncStorage.removeItem(GUEST_KEY);
    setUser(null);
  }, []);

  const value = useMemo<Ctx>(() => ({
    loading, user, signInEmail, registerEmail, skipAuth, signOut,
  }), [loading, user, signInEmail, registerEmail, skipAuth, signOut]);

  return <CtxRef.Provider value={value}>{children}</CtxRef.Provider>;
}
