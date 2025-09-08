import React, { useCallback, useMemo, useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Modal, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

import { useProjects, Block } from '../contexts/ProjectsContext';
import { getPalette } from '../theme';
import { isLikelyUrl, normalizeUrl } from '../utils/url';

const UI = getPalette('latte');
type DraftMap = Record<string, Partial<Block>>;

export default function ProjectDashboard() {
  const navigation = useNavigation<any>();
  const api: any = useProjects();
  const { currentProject, updateBlock, updateProject, addNewProject, setCurrentProjectId, duplicateBlock, reorderBlocks } = api;
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
  const removeBlock = useCallback((id: string) => { api?.removeBlock ? api.removeBlock(id) : Alert.alert('Удаление блока', 'Метод removeBlock не реализован.'); }, [api]);
  const moveUp = useCallback((id: string) => api?.moveBlock?.(id, -1), [api]);
  const moveDown = useCallback((id: string) => api?.moveBlock?.(id, +1), [api]);

  const [addOpen, setAddOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);

  const themeOptions = useMemo(() => ([
    { key: 'latte', label: 'Latte' },
    { key: 'sapphire', label: 'Sapphire' },
    { key: 'violet', label: 'Violet' },
  ]), []);

  const applyTemplate = useCallback((mode: 'append' | 'replace') => {
    const base: Block[] = [
      { id: `blk_${Math.random()}`, type: 'image', uri: '', borderRadius: 24 } as any,
      { id: `blk_${Math.random()}`, type: 'text', text: 'Привет! Я создаю контент 🌟 Подпишись и загляни по ссылкам ниже.', fontSize: 18 } as any,
      { id: `blk_${Math.random()}`, type: 'button', title: 'Instagram', url: 'instagram.com/username', iconName: 'instagram', radius: 14 } as any,
      { id: `blk_${Math.random()}`, type: 'button', title: 'YouTube', url: 'youtube.com/@username', iconName: 'youtube', radius: 14 } as any,
      { id: `blk_${Math.random()}`, type: 'button', title: 'Telegram', url: 't.me/username', iconName: 'telegram', radius: 14 } as any,
    ];
    if (mode === 'replace') {
      updateProject({ blocks: base as any });
    } else {
      const merged = [ ...(currentProject.blocks ?? []), ...base ];
      updateProject({ blocks: merged as any });
    }
    setTplOpen(false);
  }, [currentProject?.blocks, updateProject]);

  // ===== Render card per block
  const renderCard = (b: Block) => {
    const d = getDraft(b);

    if (b.type === 'text') {
      return (
        <View style={styles.card}>
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
            multiline
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
      const urlVal = (d as any).url ?? (b as any).url ?? '';
      const isValid = !urlVal || isLikelyUrl(urlVal);
      return (
        <View style={styles.card}>
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
            style={[styles.input, !isValid && { borderColor: '#dc2626' }]}
            placeholder="https://ссылка  |  t.me/username  |  mailto:me@example.com"
            placeholderTextColor={UI.textMuted}
            autoCapitalize="none"
            keyboardType="url"
            defaultValue={(b as any).url}
            onChangeText={(t) => setDraftField(b.id, { url: t })}
            onBlur={() => {
              const raw = (d as any).url ?? '';
              const norm = normalizeUrl(raw);
              if (norm !== (b as any).url) updateBlock(b.id, { url: norm });
            }}
          />
          {!isValid && (
            <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>
              Неверный URL. Пример: example.com, https://..., t.me/..., mailto:...
            </Text>
          )}

          <View style={[styles.row, { marginTop: 8 }]}>
            <Pressable style={styles.iconPick} onPress={() => setIconPicker({ open: true, blockId: b.id })}>
              <MaterialCommunityIcons name={(b as any).iconName || 'link'} size={18} color={UI.text} />
              <Text style={{ color: UI.text, marginLeft: 8 }}>
                {(b as any).iconName || 'Иконка'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Text style={styles.sub}>Скругление: {((d as any).radius ?? (b as any).radius ?? 12)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={32}
              step={1}
              value={(d as any).radius ?? (b as any).radius ?? 12}
              onValueChange={(v) => setDraftField(b.id, { radius: v as number })}
              onSlidingComplete={(v) => updateBlock(b.id, { radius: v as number })}
            />
          </View>
        </View>
      );
    }

    if (b.type === 'image') {
      return (
        <View style={styles.card}>
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
            <Text style={styles.sub}>Скругление: {((getDraft(b) as any).borderRadius ?? (b as any).borderRadius ?? 12)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={64}
              step={1}
              value={(getDraft(b) as any).borderRadius ?? (b as any).borderRadius ?? 12}
              onValueChange={(v) => setDraftField(b.id, { borderRadius: v as number })}
              onSlidingComplete={(v) => updateBlock(b.id, { borderRadius: v as number })}
            />
          </View>
        </View>
      );
    }

    if (b.type === 'spacer') {
      return (
        <View style={styles.card}>
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
            <Text style={styles.sub}>Высота: {((getDraft(b) as any).height ?? (b as any).height ?? 16)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={64}
              step={1}
              value={(getDraft(b) as any).height ?? (b as any).height ?? 16}
              onValueChange={(v) => setDraftField(b.id, { height: v as number })}
              onSlidingComplete={(v) => updateBlock(b.id, { height: v as number })}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.label}>Неизвестный блок: {b.type}</Text>
      </View>
    );
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Block>) => (
    <Pressable onLongPress={drag} disabled={isActive} style={{ opacity: isActive ? 0.9 : 1 }}>
      {renderCard(item)}
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: UI.bg }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={{ flex: 1, padding: 16, paddingBottom: 96 }}>
        {/* Заголовок */}
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
            <Pressable style={styles.badge} onPress={() => setTplOpen(true)}>
              <MaterialCommunityIcons name="magic-staff" size={14} color={UI.text} />
              <Text style={styles.badgeText}>Шаблоны</Text>
            </Pressable>
          </View>
        </View>

        {/* ТЕМА СТРАНИЦЫ (влияет на Preview/публикацию) */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.typePill}><Text style={styles.typePillText}>Тема страницы</Text></View>
          </View>
          <Text style={styles.sub}>Влияет на страницу/превью, а не на интерфейс редактора.</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            {themeOptions.map(opt => (
              <Pressable key={opt.key} onPress={() => updateProject({ themeKey: opt.key as any })} style={styles.swatch}>
                <Text style={{ color: UI.text, fontWeight: '700' }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* DnD список блоков */}
        <DraggableFlatList
          containerStyle={{ flexGrow: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          data={blocks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={({ data }) => reorderBlocks(data.map(d => d.id))}
        />
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
                <Pressable key={it.type} style={styles.addCell} onPress={() => { setAddOpen(false); api.addBlock(it.type as any); }}>
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

      {/* Шаблоны */}
      <Modal visible={tplOpen} transparent animationType="fade" onRequestClose={() => setTplOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Быстрые шаблоны</Text>
            <Text style={{ color: UI.textMuted, marginBottom: 10 }}>Creator pack: аватар, bio-текст, 3 кнопки соцсетей.</Text>
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={styles.primaryBtn} onPress={() => applyTemplate('append')}>
                <Text style={{ color: UI.accentFg, fontWeight: '700' }}>Добавить</Text>
              </Pressable>
              <View style={{ width: 8 }} />
              <Pressable
                style={[styles.btnGhost, { borderColor: UI.border }]}
                onPress={() => {
                  Alert.alert('Заменить содержимое?', 'Это удалит текущие блоки и вставит шаблон.', [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Заменить', style: 'destructive', onPress: () => applyTemplate('replace') },
                  ]);
                }}
              >
                <Text style={{ color: UI.text, fontWeight: '700' }}>Заменить</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.btnGhost, { alignSelf: 'flex-end', marginTop: 8, borderColor: UI.border }]} onPress={() => setTplOpen(false)}>
              <Text style={{ color: UI.text }}>Закрыть</Text>
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
  projectTitleInput: { color: UI.text, fontSize: 18, fontWeight: '800', flex: 1, paddingRight: 12, backgroundColor: UI.glass, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },

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

  input: { backgroundColor: UI.glass, borderRadius: 12, paddingHorizontal: 12, paddingVertical: Platform.select({ ios: 12, android: 8 }), color: UI.text, borderWidth: 1, borderColor: UI.border },

  row: { marginTop: 10 },
  slider: { width: '100%', height: 36, marginTop: 6 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: UI.accent, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  btnGhost: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },

  iconPick: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: UI.glass, alignSelf: 'flex-start' },

  swatch: { width: 86, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginRight: 10, borderRadius: 12, backgroundColor: UI.glass, borderWidth: 1, borderColor: UI.border },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalBody: { backgroundColor: UI.card, borderRadius: 16, padding: 16, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: UI.border },
  modalTitle: { color: UI.text, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  iconCell: { width: '25%', alignItems: 'center', marginBottom: 12, paddingVertical: 8, borderRadius: 10 },

  addGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  addCell: { width: '25%', alignItems: 'center', marginBottom: 12, paddingVertical: 8, borderRadius: 10 },
});
