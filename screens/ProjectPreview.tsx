import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { useProjects, Block } from '../contexts/ProjectsContext';
import { getPalette } from '../theme';
import QRSheet from '../components/QRSheet';

function getBaseUrl(): string {
  // Можно задать в app.json -> "extra": { "EXPO_PUBLIC_BASE_URL": "https://your-domain.com" }
  // Фоллбэк на наш плейсхолдер
  // @ts-ignore
  return (Constants.expoConfig?.extra?.EXPO_PUBLIC_BASE_URL as string) || 'https://linkpro.app';
}

export default function ProjectPreview() {
  const { currentProject } = useProjects();
  const pal = getPalette(currentProject?.themeKey ?? 'latte');

  const [qr, setQr] = useState<{ open: boolean; value: string; title?: string }>({ open: false, value: '' });

  const pageUrl = useMemo(() => {
    if (!currentProject) return '';
    return `${getBaseUrl()}/p/${encodeURIComponent(currentProject.id)}`;
  }, [currentProject]);

  useLayoutEffect(() => {
    // Кнопка QR в заголовке — для QR всей страницы (с рефметкой)
    if (!currentProject) return;
    setTimeout(() => {
      // @ts-ignore
      navigation?.setOptions?.({
        headerRight: () => (
          <Pressable
            onPress={() => setQr({ open: true, value: `${pageUrl}?ref=qr`, title: 'QR — страница' })}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: pal.card, borderWidth: 1, borderColor: pal.border }}
          >
            <MaterialCommunityIcons name="qrcode" size={18} color={pal.text} />
          </Pressable>
        ),
      });
    }, 0);
  }, [pageUrl, pal, currentProject]);

  if (!currentProject) {
    return (
      <View style={{ flex: 1, backgroundColor: pal.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: pal.text }}>Проект не выбран</Text>
      </View>
    );
  }

  const blocks = currentProject.blocks ?? [];

  const openButtonQR = (b: Block) => {
    // Трекинговая ссылка на страницу проекта с меткой блока (чтобы считать сканы)
    const url = `${pageUrl}?ref=qr_btn_${encodeURIComponent(b.id)}`;
    setQr({ open: true, value: url, title: 'QR — кнопка' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: pal.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Заголовок */}
        <View style={{ backgroundColor: pal.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: pal.border, marginBottom: 12 }}>
          <Text style={{ color: pal.text, fontSize: 18, fontWeight: '800' }}>
            {currentProject.name || 'Без названия'}
          </Text>
          <Text style={{ color: pal.text, opacity: 0.6, marginTop: 2, fontSize: 12 }}>{pageUrl}</Text>
        </View>

        {blocks.map((b) => {
          if (b.type === 'text') {
            const fontSize = (b as any).fontSize ?? 16;
            return (
              <View key={b.id} style={{ padding: 0, backgroundColor: 'transparent' }}>
                <Text style={{ color: pal.text, fontSize, marginBottom: 12 }}>{(b as any).text || ''}</Text>
              </View>
            );
          }

          if (b.type === 'button') {
            const radius = (b as any).radius ?? 12;
            return (
              <View key={b.id} style={{ marginBottom: 12 }}>
                <Pressable
                  style={{
                    backgroundColor: pal.accent,
                    paddingVertical: 14, paddingHorizontal: 16,
                    borderRadius: radius, alignItems: 'center', justifyContent: 'center',
                  }}
                  onPress={() => { /* здесь можно открыть внешнюю ссылку через WebBrowser */ }}
                >
                  <Text style={{ color: pal.accentFg, fontWeight: '700', fontSize: 16 }}>
                    {(b as any).title || 'Кнопка'}
                  </Text>
                </Pressable>

                <View style={{ alignItems: 'flex-end', marginTop: 6 }}>
                  <Pressable
                    onPress={() => openButtonQR(b)}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 10, paddingVertical: 6,
                      borderRadius: 10, backgroundColor: pal.card,
                      borderWidth: 1, borderColor: pal.border,
                    }}
                  >
                    <MaterialCommunityIcons name="qrcode" size={16} color={pal.text} />
                    <Text style={{ marginLeft: 6, color: pal.text }}>QR для кнопки</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          if (b.type === 'image') {
            const uri = (b as any).uri;
            const borderRadius = (b as any).borderRadius ?? 12;
            if (!uri) return null;
            return (
              <View key={b.id} style={{ backgroundColor: pal.card, borderRadius, padding: 0, borderWidth: 1, borderColor: pal.border, overflow: 'hidden', marginBottom: 12 }}>
                <Image source={{ uri }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
              </View>
            );
          }

          if (b.type === 'spacer') {
            const height = (b as any).height ?? 16;
            return <View key={b.id} style={{ height }} />;
          }

          return null;
        })}
      </ScrollView>

      {/* Общая модалка QR */}
      <QRSheet
        visible={qr.open}
        onClose={() => setQr({ open: false, value: '' })}
        value={qr.value}
        title={qr.title}
        palette={pal}
      />
    </View>
  );
}
