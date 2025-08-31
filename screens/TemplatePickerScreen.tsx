import React from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TouchableOpacity, FlatList } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { TEMPLATE_META, TemplateKey } from "../templates";
import { useProjects } from "../contexts/ProjectsContext";

const PREVIEW_GRADIENT: Record<string, string[]> = {
  ocean: ["#4facfe", "#00f2fe"],
  violet: ["#8E2DE2", "#FF416C"],
  forest: ["#11998e", "#38ef7d"],
  sunset: ["#ff7e5f", "#feb47b"],
  dark: ["#0f172a", "#0b1220"],
  light: ["#ffffff", "#f8fafc"],
};

export default function TemplatePickerScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { projectId } = route.params as any;
  const { applyTemplate } = useProjects();

  const data = Object.entries(TEMPLATE_META) as [TemplateKey, any][];

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Выберите шаблон</Text>
        <FlatList
          data={data}
          keyExtractor={([k]) => k}
          renderItem={({ item }) => {
            const [key, meta] = item;
            return (
              <TouchableOpacity
                onPress={async () => {
                  await applyTemplate(projectId, key as TemplateKey);
                  navigation.goBack();
                }}
                style={{ marginBottom: 14, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb" }}
              >
                <LinearGradient colors={PREVIEW_GRADIENT[meta.theme] || PREVIEW_GRADIENT.light} style={{ padding: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: meta.theme === "dark" ? "#fff" : "#111" }}>
                    {meta.title}
                  </Text>
                  <Text style={{ color: meta.theme === "dark" ? "#d1d5db" : "#374151" }}>{meta.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
