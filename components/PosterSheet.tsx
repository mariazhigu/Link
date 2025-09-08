import React, { useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Alert, Platform, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

type Palette = {
  bg: string; card: string; border: string; glass: string; text: string; textMuted: string;
  accent: string; accentFg: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  url: string;
  palette: Palette;
  coverUri?: string;  // возьмём из первого image-блока, если есть
};

export default function PosterSheet({ visible, onClose, title, url, palette, coverUri }: Props) {
  const urlSafe = (url ?? '').trim();
  if (!visible || !urlSafe) return null;

  const shotRef = useRef<ViewShot>(null);

  const doSave = async () => {
    try {
      const uri = await shotRef.current?.capture?.({ format: 'png', result: 'tmpfile', quality: 1 });
      if (!uri) throw new Error('capture failed');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Нет доступа', 'Разрешите доступ к медиатеке, чтобы сохранять изображения.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Сохранено', 'Обложка сохранена в галерею.');
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить обложку.');
    }
  };

  const doShare = async () => {
    try {
      const uri = await shotRef.current?.capture?.({ format: 'png', result: 'tmpfile', quality: 1 });
      if (!uri) throw new Error('capture failed');
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Шэринг недоступен', Platform.select({ ios: 'Недоступен на этом устройстве', android: 'Недоступен на этом устройстве', default: 'Sharing API недоступен' })!);
        return;
      }
      await Sharing.shareAsync(uri, { dialogTitle: 'Обложка' });
    } catch {
      Alert.alert('Ошибка', 'Не удалось поделиться.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.body, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ViewShot ref={shotRef} style={[styles.poster, { backgroundColor: palette.bg, borderColor: palette.border }]}>
            <View style={{ padding: 16 }}>
              <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 6 }}>LinkPro</Text>
              <Text style={{ color: palette.text, fontSize: 24, fontWeight: '800' }}>{title}</Text>
            </View>

            {coverUri ? (
              <View style={{ marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: palette.border }}>
                <Image source={{ uri: coverUri }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
              </View>
            ) : null}

            <View style={{ alignItems: 'center', padding: 16 }}>
              <View style={{ borderRadius: 16, padding: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card }}>
                <QRCode value={urlSafe} size={200} backgroundColor={palette.card} color={palette.text} />
              </View>
              <Text style={{ color: palette.textMuted, marginTop: 10 }} numberOfLines={1}>{urlSafe}</Text>
            </View>
          </ViewShot>

          <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'center' }}>
            <Pressable onPress={doSave} style={[styles.btn, { backgroundColor: palette.accent }]}>
              <Text style={{ color: palette.accentFg, fontWeight: '700' }}>Сохранить PNG</Text>
            </Pressable>
            <View style={{ width: 8 }} />
            <Pressable onPress={doShare} style={[styles.btnGhost, { borderColor: palette.border }]}>
              <Text style={{ color: palette.text, fontWeight: '700' }}>Поделиться</Text>
            </Pressable>
          </View>
          <Pressable onPress={onClose} style={[styles.btnGhost, { marginTop: 10, borderColor: palette.border }]}>
            <Text style={{ color: palette.text }}>Закрыть</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  body: { width: '100%', maxWidth: 480, borderRadius: 16, padding: 16, borderWidth: 1 },
  poster: { width: '100%', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  btnGhost: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});
