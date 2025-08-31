import React, { useState } from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TextInput, TouchableOpacity, Alert, Share } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useProjects } from "../contexts/ProjectsContext";

export default function ProjectSettingsScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { projectId } = route.params as any;
  const { getProject, updateProject, deleteProject, getPublicUrl } = useProjects();

  const project = getProject(projectId);
  const [name, setName] = useState(project?.name || "");
  const [slug, setSlug] = useState(project?.slug || "");
  const [title, setTitle] = useState(project?.title || "");
  const [description, setDescription] = useState(project?.description || "");

  if (!project) return null;

  const onSave = async () => {
    await updateProject(project.id, { name, slug, title, description });
    Alert.alert("Сохранено", "Настройки проекта обновлены");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
      <View style={{ padding: 20, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>Настройки проекта</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#2563eb", fontWeight: "700" }}>Закрыть</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 12, color: "#6b7280" }}>Имя (для вас)</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={{ fontSize: 12, color: "#6b7280" }}>Slug (в ссылке)</Text>
        <TextInput style={styles.input} value={slug} onChangeText={setSlug} autoCapitalize="none" />

        <Text style={{ fontSize: 12, color: "#6b7280" }}>Заголовок на странице</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={{ fontSize: 12, color: "#6b7280" }}>Описание</Text>
        <TextInput style={[styles.input, { height: 90, textAlignVertical: "top" }]} multiline value={description} onChangeText={setDescription} />

        <TouchableOpacity onPress={onSave} style={styles.primary}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>Сохранить</Text>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 10 }} />

        <Text style={{ fontSize: 12, color: "#6b7280" }}>Публичная ссылка</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ flex: 1, color: "#111827" }}>{getPublicUrl(project)}</Text>
          <TouchableOpacity
            onPress={async () => {
              const url = getPublicUrl(project);
              await Clipboard.setStringAsync(url);
              Alert.alert("Скопировано", url);
            }}
            style={styles.outline}
          >
            <Ionicons name="copy-outline" size={18} color="#0369a1" />
            <Text style={{ color: "#0369a1", fontWeight: "700" }}>Копировать</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const url = getPublicUrl(project);
              Share.share({ message: url, url });
            }}
            style={styles.outlineYellow}
          >
            <Ionicons name="share-social-outline" size={18} color="#92400e" />
            <Text style={{ color: "#92400e", fontWeight: "700" }}>Поделиться</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 10 }} />

        <TouchableOpacity
          onPress={() => navigation.navigate("TemplatePicker", { projectId: project.id })}
          style={{ backgroundColor: "#eef2ff", padding: 12, borderRadius: 10, alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center" }}
        >
          <Ionicons name="color-palette-outline" size={18} color="#4f46e5" />
          <Text style={{ color: "#4f46e5", fontWeight: "800" }}>Выбрать шаблон</Text>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 10 }} />

        <TouchableOpacity
          onPress={() => {
            Alert.alert("Удалить проект?", "Действие необратимо", [
              { text: "Отмена", style: "cancel" },
              {
                text: "Удалить",
                style: "destructive",
                onPress: async () => {
                  await deleteProject(project.id);
                  Alert.alert("Удалено", "Проект удалён");
                  navigation.goBack();
                },
              },
            ]);
          }}
          style={{ backgroundColor: "#fee2e2", padding: 12, borderRadius: 10, alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center" }}
        >
          <Ionicons name="trash-outline" size={18} color="#b91c1c" />
          <Text style={{ color: "#b91c1c", fontWeight: "800" }}>Удалить проект</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  primary: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  outline: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#e0f2fe",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  outlineYellow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fef9c3",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
} as const;
