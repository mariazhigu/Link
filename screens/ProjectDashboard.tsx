import React, { useCallback, useMemo, useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Modal, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProjects, Block } from '../contexts/ProjectsContext';
import { getPalette, palettes } from '../theme';

type DraftMap = Record<string, Partial<Block>>;

export default function ProjectDashboard() {
  const navigation = useNavigation<any>();
  const projectsApi: any = useProjects();
  const { currentProject, updateBlock, updateProject, addNewProject, setCurrentProjectId } = projectsApi;
  const blocks: Block[] = currentProject?.blocks ?? [];
  const palette = getPalette(currentProject?.themeKey ?? 'latte');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Preview')} style={[styles.headerBtn, { backgroundColor: palette.glass }]}>
          <MaterialCommunityIcons name="eye-outline" size={18} color={palette.text} />
          <Text style={[styles.headerBtnText, { color: palette.text }]}>Превью</Text>
        </Pressable>
      ),
    });
  }, [navigation, palette]);

  if (!currentProject) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: palette.textMuted, textAlign: 'center', marginBottom: 12 }}>
          Проект не выбран. Создайте новый или выберите из списка.
        </Text>
        <Pressable onPress={() => navigation.navigate('Projects')} style={[styles.primaryBtn(palette), { marginBottom: 10 }]}>
          <Text style={{ color: palette.accentFg }}>К проектам</Text>
        </Pressable>
        <Pressable
          onPress={() => { const id = addNewProject('Новый проект'); setCurrentProjectId(id); }}
          style={styles.primaryBtn(palette)}
        >
          <Text style={{ color: palette.accentFg }}>Создать проект</Text>
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
    if (projectsApi?.addBlock) projectsApi.addBlock(type);
    else Alert.alert('Добавление блока', 'Метод addBlock не реализован в контексте.');
  }, [projectsApi]);

  const removeBlock = useCallback((id: string) => {
    if (projectsApi?.removeBlock) projectsApi.removeBlock(id);
    else Alert.alert('Удаление блока', 'Метод removeBlock не реализован.');
  }, [projectsApi]);

  const moveUp = useCallback((id: string) => projectsApi?.moveBlock?.(id, -1), [projectsApi]);
  const moveDown = useCallback((id: string) => projectsApi?.moveBlock?.(id, +1), [projectsApi]);

  const [addOpen, setAddOpen] = useState(false);

  const themeOptions = useMemo(() => ([
    { key: 'latte', label: 'Latte' },
    { key: 'sapphire', label: 'Sapphire' },
    { key: 'violet', label: 'Violet' },
  ]), []);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="always">
          {/* Заголовок проекта + быстрая кнопка */}
          <View style={styles.projectHead}>
            <TextInput
              style={[styles.projectTitleInput(palette)]}
              placeholder="Название проекта"
              placeholderTextColor={palette.textMuted}
              defaultValue={currentProject.name}
              onEndEditing={(e) => {
                const name = e.nativeEvent.text.trim() || 'Без названия';
                if (name !== currentProject.name) updateProject({ name });
              }}
            />
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={styles.badgeAccent(palette)} onPress={() => setAddOpen(true)}>
                <MaterialCommunityIcons name="plus" size={14} color={palette.accentFg} />
                <Text style={styles.badgeAccentText(palette)}>Блок</Text>
              </Pressable>
              <View style={{ width: 6 }} />
              <Pressable style={styles.badge(palette)} onPress={() => navigation.navigate('Preview')}>
                <MaterialCommunityIcons name="eye-outline" size={14} color={palette.text} />
                <Text style={styles.badgeText(palette)}>Превью</Text>
              </Pressable>
            </View>
          </View>

          {/* ТЕМА СТРАНИЦЫ */}
          <View style={styles.card(palette)}>
            <View style={styles.cardHead}>
              <View style={styles.typePill(palette)}><Text style={styles.typePillText(palette)}>Тема</Text></View>
            </View>
            <Text style={styles.sub(palette)}>Выберите цветовую палитру для этого проекта.</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              {themeOptions.map(opt => {
                const pal = getPalette(opt.key);
                const active = currentProject.themeKey === opt.key || (!currentProject.themeKey && opt.key === 'latte');
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => updateProject({ themeKey: opt.key })}
                    style={[
                      styles.themeSwatch(palette),
                      active && { borderColor: pal.accent, borderWidth: 2 },
                    ]}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: pal.accent }} />
                    <Text style={{ color: palette.text, marginTop: 6, fontSize: 12 }}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* БЛОКИ */}
          {blocks.map((b) => {
            const d = getDraft(b);

            if (b.type === 'text') {
              return (
                <View key={b.id} style={styles.card(palette)}>
                  <View style={styles.cardHead}>
                    <View style={styles.typePill(palette)}><Text style={styles.typePillText(palette)}>Текст</Text></View>
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => moveUp?.(b.id)}><MaterialCommunityIcons name="arrow-up" size={18} color={palette.text} /></Pressable>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => moveDown?.(b.id)}><MaterialCommunityIcons name="arrow-down" size={18} color={palette.text} /></Pressable>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => removeBlock?.(b.id)}><MaterialCommunityIcons name="delete" size={18} color={palette.text} /></Pressable>
                    </View>
                  </View>

                  <TextInput
                    style={styles.input(palette)}
                    placeholder="Введите текст…"
                    placeholderTextColor={palette.textMuted}
                    defaultValue={(b as any).text}
                    onChangeText={(t) => setDraftField(b.id, { text: t })}
                    onBlur={() => d.text !== (b as any).text && updateBlock(b.id, { text: d.text })}
                  />

                  <View style={styles.row}>
                    <Text style={styles.sub(palette)}>Размер: {d.fontSize ?? (b as any).fontSize ?? 16}</Text>
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
                <View key={b.id} style={styles.card(palette)}>
                  <View style={styles.cardHead}>
                    <View style={styles.typePill(palette)}><Text style={styles.typePillText(palette)}>Кнопка</Text></View>
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => moveUp?.(b.id)}><MaterialCommunityIcons name="arrow-up" size={18} color={palette.text} /></Pressable>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => moveDown?.(b.id)}><MaterialCommunityIcons name="arrow-down" size={18} color={palette.text} /></Pressable>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => removeBlock?.(b.id)}><MaterialCommunityIcons name="delete" size={18} color={palette.text} /></Pressable>
                    </View>
                  </View>

                  <TextInput
                    style={styles.input(palette)}
                    placeholder="Заголовок кнопки"
                    placeholderTextColor={palette.textMuted}
                    defaultValue={(b as any).title}
                    onChangeText={(t) => setDraftField(b.id, { title: t })}
                    onBlur={() => d.title !== (b as any).title && updateBlock(b.id, { title: d.title })}
                  />

                  <TextInput
                    style={styles.input(palette)}
                    placeholder="https://ссылка"
                    placeholderTextColor={palette.textMuted}
                    autoCapitalize="none"
                    keyboardType="url"
                    defaultValue={(b as any).url}
                    onChangeText={(t) => setDraftField(b.id, { url: t })}
                    onBlur={() => d.url !== (b as any).url && updateBlock(b.id, { url: d.url })}
                  />

                  <View style={[styles.row, { marginTop: 8 }]}>
                    <Pressable style={styles.iconPick(palette)} onPress={() => setIconPicker({ open: true, blockId: b.id })}>
                      <MaterialCommunityIcons name={(b as any).iconName || 'link'} size={18} color={palette.text} />
                      <Text style={{ color: palette.text, marginLeft: 8 }}>
                        {(b as any).iconName || 'Иконка'}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.sub(palette)}>Скругление: {d.radius ?? (b as any).radius ?? 12}</Text>
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
                <View key={b.id} style={styles.card(palette)}>
                  <View style={styles.cardHead}>
                    <View style={styles.typePill(palette)}><Text style={styles.typePillText(palette)}>Изображение</Text></View>
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => moveUp?.(b.id)}><MaterialCommunityIcons name="arrow-up" size={18} color={palette.text} /></Pressable>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => moveDown?.(b.id)}><MaterialCommunityIcons name="arrow-down" size={18} color={palette.text} /></Pressable>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => removeBlock?.(b.id)}><MaterialCommunityIcons name="delete" size={18} color={palette.text} /></Pressable>
                    </View>
                  </View>

                  <Pressable onPress={() => pickImage(b.id)} style={styles.primaryBtn(palette)}>
                    <MaterialCommunityIcons name="image" size={18} color={palette.accentFg} />
                    <Text style={{ marginLeft: 8, color: palette.accentFg, fontWeight: '600' }}>
                      {(b as any).uri ? 'Заменить фото' : 'Выбрать фото'}
                    </Text>
                  </Pressable>

                  <View style={styles.row}>
                    <Text style={styles.sub(palette)}>Скругление: {d.borderRadius ?? (b as any).borderRadius ?? 12}</Text>
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
                <View key={b.id} style={styles.card(palette)}>
                  <View style={styles.cardHead}>
                    <View style={styles.typePill(palette)}><Text style={styles.typePillText(palette)}>Отступ</Text></View>
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => moveUp?.(b.id)}><MaterialCommunityIcons name="arrow-up" size={18} color={palette.text} /></Pressable>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => moveDown?.(b.id)}><MaterialCommunityIcons name="arrow-down" size={18} color={palette.text} /></Pressable>
                      <Pressable style={styles.iconBtn(palette)} onPress={() => removeBlock?.(b.id)}><MaterialCommunityIcons name="delete" size={18} color={palette.text} /></Pressable>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.sub(palette)}>Высота: {d.height ?? (b as any).height ?? 16}</Text>
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
              <View key={b.id} style={styles.card(palette)}>
                <Text style={styles.label(palette)}>Неизвестный блок: {b.type}</Text>
              </View>
            );
          })}
        </ScrollView>

        <Pressable style={styles.fab(palette)} onPress={() => setAddOpen(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={palette.accentFg} />
        </Pressable>
      </View>

      {/* Иконки */}
      <Modal visible={iconPicker.open} transparent animationType="fade" onRequestClose={() => setIconPicker({ open: false })}>
        <View style={styles.modalWrap}>
          <View style={styles.modalBody(palette)}>
            <Text style={styles.modalTitle(palette)}>Выберите иконку</Text>
            <View style={styles.iconGrid}>
              {candidateIcons.map((name) => (
                <Pressable key={name} style={styles.iconCell} onPress={() => commitIcon(name)}>
                  <MaterialCommunityIcons name={name as any} size={24} color={palette.text} />
                  <Text style={{ marginTop: 6, fontSize: 12, color: palette.text }}>{name}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.primaryBtn(palette), { alignSelf: 'flex-end', marginTop: 8 }]} onPress={() => setIconPicker({ open: false })}>
              <Text style={{ color: palette.accentFg }}>Отмена</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Добавление блока */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalBody(palette)}>
            <Text style={styles.modalTitle(palette)}>Добавить блок</Text>
            <View style={styles.addGrid}>
              {[
                { type: 'text', label: 'Текст', icon: 'format-text' },
                { type: 'button', label: 'Кнопка', icon: 'gesture-tap-button' },
                { type: 'image', label: 'Изображение', icon: 'image' },
                { type: 'spacer', label: 'Отступ', icon: 'swap-vertical' },
              ].map((it) => (
                <Pressable key={it.type} style={styles.addCell} onPress={() => { setAddOpen(false); addBlock(it.type as any); }}>
                  <MaterialCommunityIcons name={it.icon as any} size={22} color={palette.text} />
                  <Text style={{ color: palette.text, marginTop: 6, fontSize: 12 }}>{it.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.primaryBtn(palette), { alignSelf: 'flex-end', marginTop: 8 }]} onPress={() => setAddOpen(false)}>
              <Text style={{ color: palette.accentFg }}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = {
  headerBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10,
  },
  headerBtnText: { marginLeft: 6, fontWeight: '600' as const },

  projectHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 10 },
  projectTitleInput: (p: any) => ({
    color: p.text, fontSize: 18, fontWeight: '800' as const, flex: 1, paddingRight: 12,
    backgroundColor: p.glass, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  }),

  badge: (p: any) => ({ flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: p.glass, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 }),
  badgeText: (p: any) => ({ color: p.text, marginLeft: 6, fontWeight: '700' as const, fontSize: 12 }),
  badgeAccent: (p: any) => ({ flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: p.accent, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 }),
  badgeAccentText: (p: any) => ({ color: p.accentFg, marginLeft: 6, fontWeight: '700' as const, fontSize: 12 }),

  card: (p: any) => ({ backgroundColor: p.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: p.border }),
  cardHead: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8 },
  typePill: (p: any) => ({ backgroundColor: p.glass, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }),
  typePillText: (p: any) => ({ color: p.text, fontSize: 12, fontWeight: '700' as const }),

  actionsRow: { flexDirection: 'row' as const },
  iconBtn: (p: any) => ({ padding: 8, borderRadius: 10, backgroundColor: p.glass, marginLeft: 6 }),

  label: (p: any) => ({ color: p.text, fontSize: 16, marginBottom: 8, fontWeight: '600' as const }),
  sub: (p: any) => ({ color: p.textMuted, fontSize: 12, marginRight: 10 }),

  input: (p: any) => ({
    backgroundColor: p.glass, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: Platform.select({ ios: 12, android: 8 }),
    color: p.text,
  }),

  row: { marginTop: 10 },
  slider: { width: '100%', height: 36, marginTop: 6 },

  primaryBtn: (p: any) => ({
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: p.accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
  }),

  iconPick: (p: any) => ({
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, backgroundColor: p.glass, alignSelf: 'flex-start' as const,
  }),

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 16 },
  modalBody: (p: any) => ({ backgroundColor: p.card, borderRadius: 16, padding: 16, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: p.border }),
  modalTitle: (p: any) => ({ color: p.text, fontSize: 16, fontWeight: '800' as const, marginBottom: 12 }),
  iconGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
  iconCell: { width: '25%', alignItems: 'center' as const, marginBottom: 12, paddingVertical: 8, borderRadius: 10 },

  addGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
  addCell: { width: '25%', alignItems: 'center' as const, marginBottom: 12, paddingVertical: 8, borderRadius: 10 },

  themeSwatch: (p: any) => ({
    alignItems: 'center' as const, justifyContent: 'center' as const,
    width: 72, paddingVertical: 10, marginRight: 10, borderRadius: 12,
    backgroundColor: p.glass, borderWidth: 1, borderColor: p.border,
  }),

  fab: (p: any) => ({
    position: 'absolute' as const, right: 16, bottom: 16,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: p.accent, alignItems: 'center' as const, justifyContent: 'center' as const,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  }),
};
