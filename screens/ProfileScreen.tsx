import React from "react";
import { SafeAreaView, ScrollView, View, Text, Image, TouchableOpacity, Linking } from "react-native";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useProjects, ThemeKey } from "../contexts/ProjectsContext";
import { normalizeUrl } from "../utils/url";

const GRADIENTS: Record<ThemeKey, string[]> = {
  light: ["#ffffff", "#f8fafc"],
  dark: ["#0f172a", "#0b1220"],
  violet: ["#8E2DE2", "#FF416C"],
  sunset: ["#ff7e5f", "#feb47b"],
  ocean: ["#4facfe", "#00f2fe"],
  forest: ["#11998e", "#38ef7d"],
};

function parseColor(spec?: string): { outline: boolean; color: string } {
  if (!spec) return { outline: false, color: "#111827" };
  if (spec.startsWith("outline:")) return { outline: true, color: spec.slice(8) || "#111827" };
  return { outline: false, color: spec };
}
function iconForKind(kind?: string, fallback?: string) {
  if (!kind || kind === "link") return fallback || "link-outline";
  if (kind === "heading") return "reader-outline";
  if (kind === "divider") return "remove-outline";
  if (kind === "video") return "play-circle-outline";
  if (kind === "music") return "musical-notes-outline";
  if (kind === "file") return "document-attach-outline";
  return "link-outline";
}

export default function PublicViewScreen() {
  const route = useRoute();
  const { projectId } = route.params as any;
  const { getProject, registerClick } = useProjects();
  const p = getProject(projectId);
  if (!p) return null;

  const grad = GRADIENTS[p.theme] || GRADIENTS.light;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={grad} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <Image source={p.avatarUri ? { uri: p.avatarUri } : { uri: "https://via.placeholder.com/100" }} style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 8 }} />
            <Text style={{ fontWeight: "700", fontSize: 20 }}>{p.title}</Text>
            {!!p.description && <Text style={{ color: "#475569", textAlign: "center" }}>{p.description}</Text>}
          </View>

          {p.links.map((l) => {
            const kind = l.kind || "link";
            const { outline, color } = parseColor(l.color);
            const bg = outline ? "transparent" : (color || "#111827");
            const textColor = outline ? (color || "#111827") : "#fff";
            const border = outline ? { borderWidth: 2, borderColor: color || "#111827" } : null;

            if (kind === "heading") {
              if (!l.title) return null;
              return <Text key={l.id} style={{ marginTop: 6, marginBottom: 4, fontSize: 16, fontWeight: "800", color: "#111827" }}>{l.title}</Text>;
            }
            if (kind === "divider") {
              return <View key={l.id} style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 }} />;
            }

            return (
              <TouchableOpacity key={l.id}
                onPress={async () => {
                  await registerClick(p.id, l.id);
                  if (l.url) Linking.openURL(normalizeUrl(l.url));
                }}
                style={[{ backgroundColor: bg, padding: 14, borderRadius: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, border || {}]}
              >
                <Ionicons name={iconForKind(kind, l.icon)} size={18} color={textColor as any} />
                <Text style={{ color: textColor, fontWeight: "600" }}>{l.title || (kind === "file" ? "Скачать" : "Открыть")}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
