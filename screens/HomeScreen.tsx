import React from "react";
import { View, Text, TouchableOpacity, Linking, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ user, navigation }) {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    navigation.replace("Auth");
  };

  return (
    <LinearGradient
      colors={["#141E30", "#243B55"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}
    >
      {/* Аватар */}
      <Image
        source={{ uri: "https://i.pravatar.cc/200" }}
        style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 20 }}
      />

      {/* Имя */}
      <Text style={{ fontSize: 24, color: "white", fontWeight: "bold", marginBottom: 30 }}>
        Привет, {user.email || user.phone || "Гость"}
      </Text>

      {/* Ссылки (как в Linktree) */}
      <TouchableOpacity
        onPress={() => Linking.openURL("https://instagram.com/")}
        style={{
          backgroundColor: "#E1306C",
          padding: 15,
          borderRadius: 10,
          width: "100%",
          marginBottom: 15,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
          Instagram
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL("https://t.me/")}
        style={{
          backgroundColor: "#0088cc",
          padding: 15,
          borderRadius: 10,
          width: "100%",
          marginBottom: 15,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
          Telegram
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL("https://youtube.com/")}
        style={{
          backgroundColor: "#FF0000",
          padding: 15,
          borderRadius: 10,
          width: "100%",
          marginBottom: 15,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
          YouTube
        </Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: "#555",
          padding: 15,
          borderRadius: 10,
          width: "100%",
          marginTop: 30,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Выйти</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
