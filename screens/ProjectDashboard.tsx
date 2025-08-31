import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useProjects, Block } from '../contexts/ProjectsContext';

type DraftMap = Record<string, Partial<Block>>;

export default function ProjectDashboard() {
  const { currentProject, updateBlock } = useProjects();
  const blocks: Block[] = currentProject?.blocks ?? [];

  // локальный draft для плавных слайдеров/инпутов
  const [draft, setDraft] = useState<DraftMap>({});
  const getDraft = useCallback((b: Block) => ({ ...b, ...(draft[b.id] ?? {}) }), [draft]);
  const setDraftField = useCallback((id: string, patch: Partial<Block>) => {
    setDraft(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  }, []);

  // простой селектор иконок
  const [iconPicker, setIconPicker] = useState<{ open: boolean; blockId?: string }>({ open: false });
  const candidateIcons = useMemo(
    () => ['link', 'flash', 'star', 'heart', 'share', 'send', 'email', 'phone', 'web', 'qrcode'],
    []
  );
  const commitIcon = useCallback((iconName: string) => {
    if (!iconPicker.blockId) return;
    updateBlock(iconPicker.blockId, { iconName });
    setIconPicker({ open: false });
  }, [iconPicker.blockId, updateBlock]);

  // выбор изображения
  const pickImage = useCallback(async (blockId: string) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к фото, чтобы выбрать изображение.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
      selectionLimit: 1,
      allowsMultipleSelection: false,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    updateBlock(blockId, { uri: asset.uri });
  }, [updateBlock]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <LinearGradient
        colors={['#0f172a', '#111827']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="always">
          {blocks.map((b) => {
            const d = getDraft(b);

            if (b.type === 'text') {
              return (
                <View key={b.id} style={styles.card}>
                  <Text style={styles.label}>Текст</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Введите текст…"
                    defaultValue={(b as any).text}
                    onChangeText={(t) => setDraftField(b.id, { text: t })}
                    onBlur={() => d.text !== (b as any).text && updateBlock(b.id, { text: d.text })}
                  />

                  <Text style={styles.sub}>Размер шрифта: {d.fontSize ?? (b as any).fontSize ?? 16}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={10}
                    maximumValue={48}
                    step={1}
                    value={d.fontSize ?? (b as any).fontSize ?? 16}
                    onValueChange={(v) => setDraftField(b.id, { fontSize: v as number })}
                    onSlidingComplete={(v) => updateBlock(b.id, { fontSize: v as number })}
                  />
                </View>
              );
            }

            if (b.type === 'button') {
              return (
                <View key={b.id} style={styles.card}>
                  <Text style={styles.label}>Кнопка</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Заголовок"
                    defaultValue={(b as any).title}
                    onChangeText={(t) => setDraftField(b.id, { title: t })}
                    onBlur={() => d.title !== (b as any).title && updateBlock(b.id, { title: d.title })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="https://ссылка"
                    defaultValue={(b as any).url}
                    autoCapitalize="none"
                    keyboardType="url"
                    onChangeText={(t) => setDraftField(b.id, { url: t })}
                    onBlur={() => d.url !== (b as any).url && updateBlock(b.id, { url: d.url })}
                  />

                  <View style={styles.row}>
                    <Pressable
                      style={styles.iconBtn}
                      onPress={() => setIconPicker({ open: true, blockId: b.id })}
                    >
                      <MaterialCommunityIcons name={(b as any).iconName || 'link'} size={20} />
                      <Text style={{ marginLeft: 8 }}>
                        {(b as any).iconName ? (b as any).iconName : 'Выбрать иконку'}
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.sub}>Радиус: {d.radius ?? (b as any).radius ?? 12}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={32}
                    step={1}
                    value={d.radius ?? (b as any).radius ?? 12}
                    onValueChange={(v) => setDraftField(b.id, { radius: v as number })}
                    onSlidingComplete={(v) => updateBlock(b.id, { radius: v as number })}
                  />
                </View>
              );
            }

            if (b.type === 'image') {
              return (
                <View key={b.id} style={styles.card}>
                  <Text style={styles.label}>Изображение</Text>
                  <Pressable onPress={() => pickImage(b.id)} style={styles.primaryBtn}>
                    <MaterialCommunityIcons name="image" size={18} />
                    <Text style={{ marginLeft: 8 }}>
                      {(b as any).uri ? 'Заменить фото' : 'Выбрать фото'}
                    </Text>
                  </Pressable>

                  <Text style={styles.sub}>Скругление: {d.borderRadius ?? (b as any).borderRadius ?? 12}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={64}
                    step={1}
                    value={d.borderRadius ?? (b as any).borderRadius ?? 12}
                    onValueChange={(v) => setDraftField(b.id, { borderRadius: v as number })}
                    onSlidingComplete={(v) => updateBlock(b.id, { borderRadius: v as number })}
                  />
                </View>
              );
            }

            if (b.type === 'spacer') {
              return (
                <View key={b.id} style={styles.card}>
                  <Text style={styles.label}>Отступ</Text>
                  <Text style={styles.sub}>Высота: {d.height ?? (b as any).height ?? 16}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={64}
                    step={1}
                    value={d.height ?? (b as any).height ?? 16}
                    onValueChange={(v) => setDraftField(b.id, { height: v as number })}
                    onSlidingComplete={(v) => updateBlock(b.id, { height: v as number })}
                  />
                </View>
              );
            }

            return (
              <View key={b.id} style={styles.card}>
                <Text style={styles.label}>Неизвестный блок: {b.type}</Text>
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Модал выбора иконки */}
      <Modal visible={iconPicker.open} transparent animationType="fade" onRequestClose={() => setIconPicker({ open: false })}>
        <View style={styles.modalWrap}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Выберите иконку</Text>
            <View style={styles.iconGrid}>
              {candidateIcons.map((name) => (
                <Pressable key={name} style={styles.iconCell} onPress={() => commitIcon(name)}>
                  <MaterialCommunityIcons name={name as any} size={24} />
                  <Text style={{ marginTop: 6, fontSize: 12 }}>{name}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.primaryBtn, { alignSelf: 'flex-end', marginTop: 8 }]} onPress={() => setIconPicker({ open: false })}>
              <Text>Отмена</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: { color: 'white', fontSize: 16, marginBottom: 8, fontWeight: '600' },
  sub: { color: '#cbd5e1', fontSize: 12, marginTop: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    color: 'white',
  },
  slider: { width: '100%', height: 36, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalWrap: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  modalBody: {
    backgroundColor: '#0b1220',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  iconCell: {
    width: '25%', alignItems: 'center', marginBottom: 12, paddingVertical: 8,
    borderRadius: 10,
  },
});
