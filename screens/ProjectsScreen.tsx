import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Alert, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProjects, Project } from '../contexts/ProjectsContext';
import { useUser } from '../contexts/UserContext';
import { palette } from '../theme';

export default function ProjectsScreen() {
  const navigation = useNavigation<any>();
  const { projects, setCurrentProjectId, addNewProject, removeProject } = useProjects();
  const { signOut } = useUser();

  const [query, setQuery] = useState('');
  const [grid, setGrid] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects || [];
    return (projects || []).filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [projects, query]);

  const create = useCallback(() => {
    const id = addNewProject('Новый проект');
    setCurrentProjectId(id);
    navigation.navigate('Dashboard');
  }, [addNewProject, navigation, setCurrentProjectId]);

  const open = useCallback((p: Project) => {
    setCurrentProjectId(p.id);
    navigation.navigate('Dashboard');
  }, [navigation, setCurrentProjectId]);

  const confirmDelete = useCallback((p: Project) => {
    Alert.alert('Удалить проект', `Удалить «${p.name || 'Без названия'}»?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeProject(p.id) },
    ]);
  }, [removeProject]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <Pressable onPress={create} style={styles.headerBtn}>
            <MaterialCommunityIcons name="plus" size={18} color={palette.text} />
            <Text style={styles.headerBtnText}>Создать</Text>
          </Pressable>
          <View style={{ width: 8 }} />
          <Pressable onPress={signOut} style={styles.headerBtn}>
            <MaterialCommunityIcons name="logout" size={18} color={palette.text} />
            <Text style={styles.headerBtnText}>Выйти</Text>
          </Pressable>
        </View>
      ),
      title: 'LinkPro — проекты',
    });
  }, [navigation, create, signOut]);

  const numColumns = grid ? 2 : 1;
  const itemStyle = grid ? styles.cardGrid : styles.card;

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={palette.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск проектов…"
            placeholderTextColor={palette.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={palette.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.toggleBtn} onPress={() => setGrid((g) => !g)}>
          <MaterialCommunityIcons name={grid ? 'view-list' : 'view-grid-outline'} size={18} color={palette.accentFg} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {filtered.length} проект{filtered.length === 1 ? '' : filtered.length < 5 ? 'а' : 'ов'}
        </Text>
        <Pressable onPress={create} style={styles.primaryBtnSmall}>
          <MaterialCommunityIcons name="plus" size={16} color={palette.accentFg} />
          <Text style={styles.primaryBtnSmallText}>Создать</Text>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={{ paddingBottom: 24 }}
        data={filtered}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => (grid ? null : <View style={{ height: 10 }} />)}
        renderItem={({ item }) => (
          <View style={itemStyle}>
            <Pressable style={{ flex: 1 }} onPress={() => open(item)}>
              <Text style={styles.name} numberOfLines={1}>{item.name || 'Без названия'}</Text>
              <Text style={styles.meta}>{(item.blocks?.length ?? 0)} блок(ов)</Text>
            </Pressable>
            <View style={styles.cardActions}>
              <Pressable style={styles.iconBtn} onPress={() => open(item)}>
                <MaterialCommunityIcons name="pencil" size={18} color={palette.text} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => confirmDelete(item)}>
                <MaterialCommunityIcons name="delete" size={18} color={palette.text} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: palette.textMuted, marginBottom: 10, textAlign: 'center' }}>
              Пока нет проектов — создайте первый.
            </Text>
            <Pressable onPress={create} style={styles.primaryBtn}>
              <MaterialCommunityIcons name="plus" size={18} color={palette.accentFg} />
              <Text style={styles.primaryBtnText}>Создать проект</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg, padding: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: palette.glass,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: Platform.select({ ios: 10, android: 6 }),
  },
  searchInput: { flex: 1, color: palette.text, marginLeft: 6 },
  toggleBtn: {
    marginLeft: 8,
    backgroundColor: palette.accent,
    padding: 10, borderRadius: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { color: palette.textMuted, fontSize: 12 },
  primaryBtnSmall: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: palette.accent,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
  },
  primaryBtnSmallText: { color: palette.accentFg, marginLeft: 6, fontWeight: '600' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1, borderColor: palette.border,
  },
  cardGrid: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1, borderColor: palette.border,
    margin: 5,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  name: { color: palette.text, fontSize: 16, fontWeight: '700' },
  meta: { color: palette.textMuted, fontSize: 12, marginTop: 4 },
  cardActions: { flexDirection: 'row', marginLeft: 10 },
  iconBtn: { padding: 10, borderRadius: 10, backgroundColor: palette.glass, marginLeft: 6 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: palette.accent,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
  },
  primaryBtnText: { color: palette.accentFg, marginLeft: 8, fontWeight: '700' },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, backgroundColor: palette.glass,
  },
  headerBtnText: { color: palette.text, marginLeft: 6, fontWeight: '600' },
});
