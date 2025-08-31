import React, { useMemo } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProjects } from '../contexts/ProjectsContext';

function safeGradient(input: any): string[] {
  return Array.isArray(input) && input.length > 0 && input.every((c) => typeof c === 'string')
    ? input
    : ['#0f172a', '#111827'];
}

export default function ProjectPreview() {
  const { currentProject } = useProjects();
  const p = currentProject;
  const bg = useMemo(() => safeGradient(p?.theme?.bg), [p?.theme?.bg]);

  if (!p) {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={{ color: '#cbd5e1' }}>Проект не выбран</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={bg} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {p.blocks?.map((b) => {
          switch (b.type) {
            case 'text':
              return (
                <Text
                  key={b.id}
                  style={{
                    color: 'white',
                    fontSize: (b as any).fontSize ?? 16,
                    textAlign: (b as any).align ?? 'left',
                    marginBottom: 12,
                  }}
                >
                  {(b as any).text ?? ''}
                </Text>
              );
            case 'button':
              return (
                <Pressable
                  key={b.id}
                  onPress={() => (b as any).url && Linking.openURL((b as any).url)}
                  style={({ pressed }) => [
                    styles.button,
                    { borderRadius: (b as any).radius ?? 12, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  {(b as any).iconName ? (
                    <MaterialCommunityIcons name={(b as any).iconName as any} size={18} style={{ marginRight: 8 }} />
                  ) : null}
                  <Text style={styles.buttonText}>{(b as any).title ?? 'Button'}</Text>
                </Pressable>
              );
            case 'image':
              return (
                <Image
                  key={b.id}
                  source={(b as any).uri ? { uri: (b as any).uri } : undefined}
                  style={{
                    width: '100%',
                    aspectRatio: 1.8,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: (b as any).borderRadius ?? 12,
                    marginBottom: 12,
                  }}
                  resizeMode="cover"
                />
              );
            case 'spacer':
              return <View key={b.id} style={{ height: (b as any).height ?? 16 }} />;
            default:
              return (
                <Text key={b.id} style={{ color: '#94a3b8', marginBottom: 8 }}>
                  Неизвестный блок
                </Text>
              );
          }
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  buttonText: { color: 'white', fontWeight: '600' },
});
