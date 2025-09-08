import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

import { useProjects, Block } from '../contexts/ProjectsContext';
import { getPalette } from '../theme';
import QRSheet from '../components/QRSheet';
import PosterSheet from '../components/PosterSheet';
import { normalizeUrl, isLikelyUrl } from '../utils/url';

function getBaseUrl(): string {
  // @ts-ignore
  return (Constants.expoConfig?.extra?.EXPO_PUBLIC_BASE_URL as string) || 'https://linkpro.app';
}

export default function ProjectPreview() {
  const navigation = useNavigation<any>();
  const { currentProject, incrementClick } = useProjects();
  const pal = getPalette(currentProject?.themeKey ?? 'latte');

  const [qr, setQr] = useState<{ open: boolean; value: string; title?: string }>({ open: false, value: '' });
  const [poster, setPoster] = useState(false);

  const pageUrl = useMemo(() => {
    if (!currentProject?.id) return '';
    return `${getBaseUrl()}/p/${encodeURIComponent(currentProject.id)}`;
  }, [currentProject?.id]);

  useLayoutEffect(() => {
    if (!pageUrl) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <Pressable
            onPress={() => setQr({ open: true, value: `${pageUrl}?ref=qr`, title: 'QR — страница' })}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}
          >
            <MaterialCommunityIcons name="qrcode" size={18} color={pal.text} />
          </Pressable>
          <Pressable
            onPress={() => setPoster(true)}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}
          >
            <MaterialCommunityIcons name="image" size={18} color={pal.text} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, pageUrl, pal.text]);

  if (!currentProject) {
    return (
      <View style={{ flex: 1, backgroundColor: pal.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: pal.text }}>Проект не выбран</Text>
      </View>
    );
  }

  const blocks = currentProject.blocks ?? [];
  const firstImageUri = (blocks.find(b => b.type === 'image') as any)?.uri as string | undefined;

  const openExternal = async (raw?: string, blockId?: string) => {
    const value = (raw ?? '').trim();
    if (!value) return;
    if (!isLikelyUrl(value)) {
      Alert.alert('Некорректная ссылка', 'Проверьте URL — кажется, он задан с ошибкой.');
      return;
    }
    try {
      const url = normalizeUrl(value);
      if (blockId) incrementClick(blockId);
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть ссылку.');
    }
  };

  const openButtonQR = (b: Block) => {
    if (!pageUrl) return;
    const url = `${pageUrl}?ref=qr_btn_${encodeURIComponent(b.id)}`;
    setQr({ open: true, value: url, title: 'QR — кнопка' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: pal.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View style={{ backgroundColor: pal.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: pal.border, marginBottom: 12 }}>
          <Text style={{ color: pal.text, fontSize: 18, fontWeight: '800' }}>
            {currentProject.name || 'Без названия'}
          </Text>
          {pageUrl ? <Text style={{ color: pal.text, opacity: 0.6, marginTop: 2, fontSize: 12 }}>{pageUrl}</Text> : null}
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
            const title = (b as any).title || 'Кнопка';
            const url = (b as any).url || '';
            return (
              <View key={b.id} style={{ marginBottom: 12 }}>
                <Pressable
                  style={{ backgroundColor: pal.accent, paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => openExternal(url, b.id)}
                >
                  <Text style={{ color: pal.accentFg, fontWeight: '700', fontSize: 16 }}>{title}</Text>
                </Pressable>

                {pageUrl ? (
                  <View style={{ alignItems: 'flex-end', marginTop: 6 }}>
                    <Pressable
                      onPress={() => openButtonQR(b)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: pal.card, borderWidth: 1, borderColor: pal.border }}
                    >
                      <MaterialCommunityIcons name="qrcode" size={16} color={pal.text} />
                      <Text style={{ marginLeft: 6, color: pal.text }}>QR для кнопки</Text>
                    </Pressable>
                  </View>
                ) : null}
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

      <QRSheet visible={qr.open} onClose={() => setQr({ open: false, value: '' })} value={qr.value} title={qr.title} palette={pal} />
      <PosterSheet visible={poster} onClose={() => setPoster(false)} title={currentProject.name || 'Без названия'} url={pageUrl} palette={pal} coverUri={firstImageUri} />
    </View>
  );
}
