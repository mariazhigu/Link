import React, { useEffect, useState } from "react";
import { SafeAreaView, Platform, StatusBar, View, Text, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useProjects, Member } from "../contexts/ProjectsContext";
import { useUser } from "../contexts/UserContext";

export default function MembersScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { projectId } = route.params as any;

  const { listMembers, inviteMember, removeMember, getProject, cloudEnabled } = useProjects();
  const { user } = useUser();
  const p = getProject(projectId);

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Member["role"]>("editor");

  const reload = async () => {
    try {
      setLoading(true);
      const data = await listMembers(projectId);
      setMembers(data);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cloudEnabled) {
      Alert.alert("Требуется аккаунт", "Участники доступны только после входа в облако.");
      navigation.goBack();
      return;
    }
    reload();
  }, [projectId]);

  if (!p) return null;

  const onInvite = async () => {
    if (!email) return Alert.alert("Укажите e-mail");
    try {
      await inviteMember(projectId, email.trim().toLowerCase(), role);
      setEmail("");
      setRole("editor");
      reload();
    } catch (e: any) {
      Alert.alert("Не удалось пригласить", e?.message || String(e));
    }
  };

  const renderItem = ({ item }: { item: Member }) => (
    <View style={{ backgroundColor: "white", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 10 }}>
      <Text style={{ fontWeight: "700", color: "#111827" }}>{item.email}{item.email === (user as any)?.email ? " (вы)" : ""}</Text>
      <Text style={{ color: "#6b7280", marginTop: 2 }}>Роль: {roleLabel(item.role)}</Text>
      {item.role !== "owner" && (
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Удалить доступ?", `Убрать ${item.email} из проекта?`, [
              { text: "Отмена", style: "cancel" },
              { text: "Удалить", style: "destructive", onPress: async () => { await removeMember(projectId, item.id); reload(); } },
            ])
          }
          style={{ backgroundColor: "#fee2e2", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: "flex-start", marginTop: 10 }}
        >
          <Text style={{ color: "#b91c1c", fontWeight: "800" }}>Удалить</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>Участники проекта</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#2563eb", fontWeight: "700" }}>Закрыть</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 }}>
          <Text style={{ fontWeight: "700", marginBottom: 6 }}>Пригласить по e-mail</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="user@example.com" autoCapitalize="none"
            style={{ backgroundColor: "white", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 8 }} />

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            {(["editor", "viewer"] as Member["role"][]).map((r) => (
              <TouchableOpacity key={r} onPress={() => setRole(r)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: role === r ? "#334155" : "#e5e7eb", backgroundColor: role === r ? "#e2e8f0" : "white" }}>
                <Text style={{ fontWeight: "700", color: "#111827" }}>{roleLabel(r)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={onInvite} style={{ backgroundColor: "#111827", padding: 12, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "800" }}>Отправить приглашение</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Загружаем участников…</Text>
          </View>
        ) : (
          <FlatList data={members} keyExtractor={(m) => m.id} renderItem={renderItem} />
        )}
      </View>
    </SafeAreaView>
  );
}

function roleLabel(r: Member["role"]) {
  return r === "owner" ? "Владелец" : r === "editor" ? "Редактор" : "Просмотр";
}
