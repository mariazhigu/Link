import React, { useCallback, useMemo, useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Modal, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useProjects, Block } from '../contexts/ProjectsContext';
import { getPalette } from '../theme';

const UI = getPalette('latte');

type DraftMap = Record<string, Partial<Block>>;

export default function ProjectDashboard() {
  const navigation = useNavigation<any>();
  const api: any = useProjects();
  const { currentProject, updateBlock, updateProject, addNewProject, setCurrentProjectId, duplicateBlock } = api;
  const blocks: Block[] = currentProject?.blocks ?? [];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Preview')} style={styles.headerBtn}>
          <MaterialCommunityIcons name="eye-outline" size={18} color={UI.text} />
          <Text style={styles.headerBtnText}>Превью</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  if (!currentProject) {
    return (
      <View style={{ flex: 1, backgroundColor: UI.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: UI.textMuted, textAlign: 'center', marginBottom: 12 }}>
          Проект не выбран. Создайте новый или выберите из списка.
        </Text>
        <Pressable onPress={() => navigation.navigate('Projects')} style={styles.primaryBtn}>
          <Text style={{ color: UI.accentFg }}>К проектам</Text>
        </Pressable>
        <View style={{ height: 8 }} />
        <Pressable
          onPress={() => { const id = addNewProject('Новый проект'); setCurrentProjectId(id); }}
          style={styles.primaryBtn}
        >
          <Text style={{ color: UI.accentFg }}>Создать проект</Text>
        </Pressable>
      </View>
    );
  }

  const [draft, setDraft] = useState<DraftMap>({});
  const getDraft = useCallback((b: Block) => ({ ...b, ...(draft[b.id] ?? {}) }), [draft]);
  const setDraftField = useCallback((id: string, patch: Partial<Block>) => {
    setDraft(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  }, []);

  const [iconPicker, setIconPicker] = useState<{ open: boolean; blockId?: string }>({ open: false });
  const candidateIcons = useMemo(() => ['link', 'flash', 'star', 'heart', 'share', 'send', 'email', 'phone', 'web', 'qrcode'], []);
  const commitIcon = useCallback((iconName: string) => {
    if (!iconPicker.blockId) return;
    updateBlock(iconPicker.blockId, { iconName });
    setIconPicker({ open: false });
  }, [iconPicker.blockId, updateBlock]);

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

  const addBlock = useCallback((type: Block['type']) => {
    api?.addBlock ? api.addBlock(type) : Alert.alert('Добавление блока', 'Метод addBlock не реализован.');
  }, [api]);

  const removeBlock = useCallback((id: string) => {
    api?.removeBlock ? api.removeBlock(id) : Alert.alert('Удаление блока', 'Метод removeBlock не реализован.');
  }, [api]);

  const moveUp = useCallback((id: string) => api?.moveBlock?.(id, -1), [api]);
  const moveDown = useCallback((id: string) => api?.moveBlock?.(id, +1), [api]);

  const [addOpen, setAddOpen] = useState(false);

  const themeOptions = useMemo(() => ([
    { key: 'latte', label: 'Latte' },
    { key: 'sapphire', label: 'Sapphire' },
    { key: 'violet', label: 'Violet' },
  ]), []);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: UI.bg }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="always">
          <View style={styles.projectHead}>
            <TextInput
              style={styles.projectTitleInput}
              placeholder="Название проекта"
              placeholderTextColor={UI.textMuted}
              defaultValue={currentProject.name}
              onEndEditing={(e) => {
                const name = e.nativeEvent.text.trim() || 'Без названия';
                if (name !== currentProject.name) updateProject({ name });
              }}
            />
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={styles.badgeAccent} onPress={() => setAddOpen(true)}>
                <MaterialCommunityIcons name="plus" size={14} color={UI.accentFg} />
                <Text style={styles.badgeAccentText}>Блок</Text>
              </Pressable>
              <View style={{ width: 6 }} />
              <Pressable style={styles.badge} onPress={() => navigation.navigate('Preview')}>
                <MaterialCommunityIcons name="eye-outline" size={14} color={UI.text} />
                <Text style={styles.badgeText}>Превью</Text>
              </Pressable>
            </View>
          </View>

          {/* ТЕМА СТРАНИЦЫ (влияет только на Preview/публикацию) */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.typePill}><Text style={styles.typePillText}>Тема страницы</Text></View>
            </View>
            <Text style={styles.sub}>Влияет на страницу/превью, а не на интерфейс редактора.</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              {themeOptions.map(opt => (
                <Pressable
                  key={opt.key}
                  onPress={() => updateProject({ themeKey: opt.key as any })}
                  style={styles.swatch}
                >
                  <Text style={{ color: UI.text, fontWeight: '700' }}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* БЛОКИ */}
          {blocks.map((b) => {
            const d = getDraft(b);

            if (b.type === 'text') {
              return (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={styles.typePill}><Text style={styles.typePillText}>Текст</Text></View>
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.iconBtn} onPress={() => moveUp?.(b.id)}><MaterialCommunityIcons name="arrow-up" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => moveDown?.(b.id)}><MaterialCommunityIcons name="arrow-down" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => duplicateBlock?.(b.id)}><MaterialCommunityIcons name="content-copy" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => removeBlock?.(b.id)}><MaterialCommunityIcons name="delete" size={18} color={UI.text} /></Pressable>
                    </View>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Введите текст…"
                    placeholderTextColor={UI.textMuted}
                    defaultValue={(b as any).text}
                    onChangeText={(t) => setDraftField(b.id, { text: t })}
                    onBlur={() => d.text !== (b as any).text && updateBlock(b.id, { text: d.text })}
                  />

                  <View style={styles.row}>
                    <Text style={styles.sub}>Размер: {d.fontSize ?? (b as any).fontSize ?? 16}</Text>
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
                </View>
              );
            }

            if (b.type === 'button') {
              return (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={styles.typePill}><Text style={styles.typePillText}>Кнопка</Text></View>
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.iconBtn} onPress={() => moveUp?.(b.id)}><MaterialCommunityIcons name="arrow-up" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => moveDown?.(b.id)}><MaterialCommunityIcons name="arrow-down" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => duplicateBlock?.(b.id)}><MaterialCommunityIcons name="content-copy" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => removeBlock?.(b.id)}><MaterialCommunityIcons name="delete" size={18} color={UI.text} /></Pressable>
                    </View>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Заголовок кнопки"
                    placeholderTextColor={UI.textMuted}
                    defaultValue={(b as any).title}
                    onChangeText={(t) => setDraftField(b.id, { title: t })}
                    onBlur={() => d.title !== (b as any).title && updateBlock(b.id, { title: d.title })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="https://ссылка"
                    placeholderTextColor={UI.textMuted}
                    autoCapitalize="none"
                    keyboardType="url"
                    defaultValue={(b as any).url}
                    onChangeText={(t) => setDraftField(b.id, { url: t })}
                    onBlur={() => d.url !== (b as any).url && updateBlock(b.id, { url: d.url })}
                  />

                  <View style={[styles.row, { marginTop: 8 }]}>
                    <Pressable style={styles.iconPick} onPress={() => setIconPicker({ open: true, blockId: b.id })}>
                      <MaterialCommunityIcons name={(b as any).iconName || 'link'} size={18} color={UI.text} />
                      <Text style={{ color: UI.text, marginLeft: 8 }}>
                        {(b as any).iconName || 'Иконка'}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.sub}>Скругление: {d.radius ?? (b as any).radius ?? 12}</Text>
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
                </View>
              );
            }

            if (b.type === 'image') {
              return (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={styles.typePill}><Text style={styles.typePillText}>Изображение</Text></View>
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.iconBtn} onPress={() => moveUp?.(b.id)}><MaterialCommunityIcons name="arrow-up" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => moveDown?.(b.id)}><MaterialCommunityIcons name="arrow-down" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => duplicateBlock?.(b.id)}><MaterialCommunityIcons name="content-copy" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => removeBlock?.(b.id)}><MaterialCommunityIcons name="delete" size={18} color={UI.text} /></Pressable>
                    </View>
                  </View>

                  <Pressable onPress={() => pickImage(b.id)} style={styles.primaryBtn}>
                    <MaterialCommunityIcons name="image" size={18} color={UI.accentFg} />
                    <Text style={{ marginLeft: 8, color: UI.accentFg, fontWeight: '600' }}>
                      {(b as any).uri ? 'Заменить фото' : 'Выбрать фото'}
                    </Text>
                  </Pressable>

                  <View style={styles.row}>
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
                </View>
              );
            }

            if (b.type === 'spacer') {
              return (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={styles.typePill}><Text style={styles.typePillText}>Отступ</Text></View>
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.iconBtn} onPress={() => moveUp?.(b.id)}><MaterialCommunityIcons name="arrow-up" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => moveDown?.(b.id)}><MaterialCommunityIcons name="arrow-down" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => duplicateBlock?.(b.id)}><MaterialCommunityIcons name="content-copy" size={18} color={UI.text} /></Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => removeBlock?.(b.id)}><MaterialCommunityIcons name="delete" size={18} color={UI.text} /></Pressable>
                    </View>
                  </View>

                  <View style={styles.row}>
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

        <Pressable style={styles.fab} onPress={() => setAddOpen(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={UI.accentFg} />
        </Pressable>
      </View>

      {/* Иконки */}
      <Modal visible={iconPicker.open} transparent animationType="fade" onRequestClose={() => setIconPicker({ open: false })}>
        <View style={styles.modalWrap}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Выберите иконку</Text>
            <View style={styles.iconGrid}>
              {candidateIcons.map((name) => (
                <Pressable key={name} style={styles.iconCell} onPress={() => commitIcon(name)}>
                  <MaterialCommunityIcons name={name as any} size={24} color={UI.text} />
                  <Text style={{ marginTop: 6, fontSize: 12, color: UI.text }}>{name}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.primaryBtn, { alignSelf: 'flex-end', marginTop: 8 }]} onPress={() => setIconPicker({ open: false })}>
              <Text style={{ color: UI.accentFg }}>Отмена</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Добавление блока */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Добавить блок</Text>
            <View style={styles.addGrid}>
              {[
                { type: 'text', label: 'Текст', icon: 'format-text' },
                { type: 'button', label: 'Кнопка', icon: 'gesture-tap-button' },
                { type: 'image', label: 'Изображение', icon: 'image' },
                { type: 'spacer', label: 'Отступ', icon: 'swap-vertical' },
              ].map((it) => (
                <Pressable key={it.type} style={styles.addCell} onPress={() => { setAddOpen(false); addBlock(it.type as any); }}>
                  <MaterialCommunityIcons name={it.icon as any} size={22} color={UI.text} />
                  <Text style={{ color: UI.text, marginTop: 6, fontSize: 12 }}>{it.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.primaryBtn, { alignSelf: 'flex-end', marginTop: 8 }]} onPress={() => setAddOpen(false)}>
              <Text style={{ color: UI.accentFg }}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: UI.glass },
  headerBtnText: { color: UI.text, marginLeft: 6, fontWeight: '600' },

  projectHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  projectTitleInput: {
    color: UI.text, fontSize: 18, fontWeight: '800', flex: 1, paddingRight: 12,
    backgroundColor: UI.glass, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },

  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: UI.glass, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  badgeText: { color: UI.text, marginLeft: 6, fontWeight: '700', fontSize: 12 },
  badgeAccent: { flexDirection: 'row', alignItems: 'center', backgroundColor: UI.accent, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  badgeAccentText: { color: UI.accentFg, marginLeft: 6, fontWeight: '700', fontSize: 12 },

  card: { backgroundColor: UI.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: UI.border },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typePill: { backgroundColor: UI.glass, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  typePillText: { color: UI.text, fontSize: 12, fontWeight: '700' },

  actionsRow: { flexDirection: 'row' },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: UI.glass, marginLeft: 6 },

  label: { color: UI.text, fontSize: 16, marginBottom: 8, fontWeight: '600' },
  sub: { color: UI.textMuted, fontSize: 12, marginRight: 10 },

  input: {
    backgroundColor: UI.glass, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: Platform.select({ ios: 12, android: 8 }),
    color: UI.text,
  },

  row: { marginTop: 10 },
  slider: { width: '100%', height: 36, marginTop: 6 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: UI.accent,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
  },

  iconPick: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, backgroundColor: UI.glass, alignSelf: 'flex-start',
  },

  swatch: {
    width: 86, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, marginRight: 10, borderRadius: 12,
    backgroundColor: UI.glass, borderWidth: 1, borderColor: UI.border,
  },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalBody: { backgroundColor: UI.card, borderRadius: 16, padding: 16, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: UI.border },
  modalTitle: { color: UI.text, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  iconCell: { width: '25%', alignItems: 'center', marginBottom: 12, paddingVertical: 8, borderRadius: 10 },

  addGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  addCell: { width: '25%', alignItems: 'center', marginBottom: 12, paddingVertical: 8, borderRadius: 10 },

  fab: {
    position: 'absolute', right: 16, bottom: 16,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: UI.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
