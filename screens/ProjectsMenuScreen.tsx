import React, { useState } from "react";
import {
  Text, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, View, Alert, Share, ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

import { useProjects } from "../contexts/ProjectsContext";
import { useUser } from "../contexts/UserContext";

export default function ProjectsMenuScreen() {
  const navigation = useNavigation<any>();
  const { projects, createProject, deleteProject, getPublicUrl } = useProjects();
  const { signOut } = useUser();
  const [creating, setCreating] = useState(false);

  const totalClicks = (id: string) => {
    const p = projects.find((x) => x.id === id);
    return p ? p.links.reduce((acc, l) => acc + (l.clicks || 0), 0) : 0;
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
      onPress={() => {
        try {
          navigation.navigate("ProjectDashboard", { projectId: item.id });
        } catch (e: any) {
          Alert.alert("Не удалось открыть проект", e?.message || String(e));
        }
      }}
      activeOpacity={0.9}
    >
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>{item.name}</Text>
      <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
        Создан: {item.createdAt} · Ссылок: {item.links?.length || 0} · Клики: {totalClicks(item.id)}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("PublicView", { projectId: item.id })}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: "#e0f2fe",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ionicons name="eye-outline" size={18} color="#0369a1" />
          <Text style={{ color: "#0369a1", fontWeight: "700" }}>Превью</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            const url = getPublicUrl(item);
            await Clipboard.setStringAsync(url);
            Alert.alert("Ссылка скопирована", url);
          }}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: "#ecfdf5",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ionicons name="copy-outline" size={18} color="#047857" />
          <Text style={{ color: "#047857", fontWeight: "700" }}>Копировать</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const url = getPublicUrl(item);
            Share.share({ message: `Моя страница: ${url}`, url });
          }}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: "#fef9c3",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ionicons name="share-outline" size={18} color="#92400e" />
          <Text style={{ color: "#92400e", fontWeight: "700" }}>Поделиться</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Alert.alert("Удалить проект?", "Действие необратимо", [
              { text: "Отмена", style: "cancel" },
              { text: "Удалить", style: "destructive", onPress: () => deleteProject(item.id) },
            ]);
          }}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: "#fee2e2",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#b91c1c" />
          <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Удалить</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={["#4facfe", "#00f2fe"]}
      style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
    >
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: "700", color: "#fff" }}>Ваши проекты</Text>
          <TouchableOpacity onPress={signOut}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Выйти</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={projects}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ color: "#fff" }}>Пока нет проектов. Создайте первый!</Text>}
        />

        <View style={{ gap: 10, marginTop: 20, marginBottom: 20 }}>
          <TouchableOpacity
            disabled={creating}
            style={{
              opacity: creating ? 0.6 : 1,
              backgroundColor: "#fff",
              padding: 15,
              borderRadius: 25,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
            onPress={async () => {
              try {
                setCreating(true);
                const p = await createProject("Новый проект");
                // @ts-ignore
                navigation.navigate("ProjectDashboard", { projectId: p.id });
              } catch (e: any) {
                Alert.alert("Ошибка создания проекта", e?.message || String(e));
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? (
              <ActivityIndicator />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#4facfe" />
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#4facfe" }}>Создать новый проект</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
