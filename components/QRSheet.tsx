import React, { useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
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
  value: string;           // что кодируем
  title?: string;          // подпись сверху
  palette: Palette;        // палитра страницы
};

export default function QRSheet({ visible, onClose, value, title, palette }: Props) {
  // ❗ Главная защита
  const codeValue = (value ?? '').toString().trim();
  if (!visible || !codeValue) return null;

  const shotRef = useRef<ViewShot>(null);

  const handleSave = async () => {
    try {
      const uri = await shotRef.current?.capture?.({ format: 'png', result: 'tmpfile', quality: 1 });
      if (!uri) throw new Error('capture failed');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Нет доступа', 'Разрешите доступ к медиатеке, чтобы сохранять изображения.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Сохранено', 'QR сохранён в галерею.');
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить QR.');
    }
  };

  const handleShare = async () => {
    try {
      const uri = await shotRef.current?.capture?.({ format: 'png', result: 'tmpfile', quality: 1 });
      if (!uri) throw new Error('capture failed');
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Шэринг недоступен', Platform.select({
          ios: 'На этом устройстве общий доступ недоступен.',
          android: 'На этом устройстве общий доступ недоступен.',
          default: 'Sharing API недоступен.',
        })!);
        return;
      }
      await Sharing.shareAsync(uri, { dialogTitle: title || 'QR' });
    } catch {
      Alert.alert('Ошибка', 'Не удалось поделиться QR.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.body, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {!!title && <Text style={[styles.title, { color: palette.text }]}>{title}</Text>}

          <ViewShot ref={shotRef} style={[styles.qrWrap, { backgroundColor: palette.bg, borderColor: palette.border }]}>
            <QRCode value={codeValue} size={220} backgroundColor={palette.bg} color={palette.text} />
          </ViewShot>

          <Text style={[styles.url, { color: palette.textMuted }]} numberOfLines={2}>{codeValue}</Text>

          <View style={styles.row}>
            <Pressable onPress={handleSave} style={[styles.btn, { backgroundColor: palette.accent }]}>
              <Text style={{ color: palette.accentFg, fontWeight: '700' }}>Сохранить PNG</Text>
            </Pressable>
            <View style={{ width: 8 }} />
            <Pressable onPress={handleShare} style={[styles.btnGhost, { borderColor: palette.border }]}>
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
  body: { width: '100%', maxWidth: 420, borderRadius: 16, padding: 16, borderWidth: 1 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  qrWrap: { alignSelf: 'center', borderWidth: 1, padding: 14, borderRadius: 16 },
  url: { marginTop: 10, textAlign: 'center' },
  row: { flexDirection: 'row', marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  btnGhost: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});
