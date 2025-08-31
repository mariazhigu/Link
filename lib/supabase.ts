// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Универсальное чтение конфигурации из нескольких источников
function readSupabaseConfig() {
  // 1) process.env (работает при использовании .env или app.config.js)
  const envUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // 2) expo.extra из app.json / app.config.js
  const extra: any =
    (Constants as any)?.expoConfig?.extra ??
    (Constants as any)?.manifestExtra ?? // запасной вариант для старых схем
    undefined;

  // 3) прямое чтение app.json (на всякий случай)
  let appJsonExtra: any = undefined;
  try {
    // путь из lib/supabase.ts к корню проекта
    const appJson = require('../app.json');
    appJsonExtra = appJson?.expo?.extra;
  } catch (e) {
    // ок, если файла нет — просто идём дальше
  }

  const url =
    envUrl ??
    extra?.EXPO_PUBLIC_SUPABASE_URL ??
    appJsonExtra?.EXPO_PUBLIC_SUPABASE_URL;

  const anon =
    envAnon ??
    extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    appJsonExtra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return { url, anon };
}

const { url: supabaseUrl, anon: supabaseAnon } = readSupabaseConfig();

if (!supabaseUrl || !supabaseAnon) {
  // Дадим в лог подсказку, откуда мы пытались читать
  console.error('Supabase env missing. Checked: process.env, Constants.expoConfig.extra/manifestExtra, app.json.extra');
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
