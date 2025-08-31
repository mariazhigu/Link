import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../App";

export default function WelcomeScreen() {
  const nav = useNavigation<any>();
  const { signInAsGuest } = useAuth();

  return (
    <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.container}>
      <Text style={styles.logo}>LinkPro</Text>
      <Text style={styles.subtitle}>Твоя стильная мультиссылка + мини-сайт</Text>

      <TouchableOpacity style={styles.primary} onPress={() => nav.navigate("SignUp")}>
        <Text style={styles.primaryText}>Создать аккаунт</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondary} onPress={() => nav.navigate("SignIn")}>
        <Text style={styles.secondaryText}>Войти</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.ghost} onPress={signInAsGuest}>
        <Text style={styles.ghostText}>Продолжить как гость</Text>
      </TouchableOpacity>

      <View style={styles.socialRow}>
        <TouchableOpacity style={[styles.socialBtn, styles.apple]}>
          <Text style={styles.socialText}>{Platform.OS === "ios" ? "Войти через Apple" : "Apple (iOS)"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, styles.google]}>
          <Text style={styles.socialText}>Войти через Google</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Соц-входы — демо-кнопки. Подключим позже.</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  logo: { fontSize: 40, fontWeight: "800", color: "white", textAlign: "center", marginBottom: 8 },
  subtitle: { color: "white", opacity: 0.9, textAlign: "center", marginBottom: 32 },
  primary: { backgroundColor: "white", padding: 16, borderRadius: 14, marginBottom: 12 },
  primaryText: { textAlign: "center", fontWeight: "700", fontSize: 16, color: "#1f1f1f" },
  secondary: { backgroundColor: "rgba(255,255,255,0.15)", padding: 16, borderRadius: 14, marginBottom: 10 },
  secondaryText: { textAlign: "center", fontWeight: "700", fontSize: 16, color: "white" },
  ghost: { padding: 14, borderRadius: 12 },
  ghostText: { textAlign: "center", color: "white", opacity: 0.9 },
  socialRow: { flexDirection: "row", gap: 10, marginTop: 18, justifyContent: "center" },
  socialBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  apple: { backgroundColor: "black" },
  google: { backgroundColor: "white" },
  socialText: { color: "#1f1f1f", fontWeight: "700", textAlign: "center" },
  hint: { marginTop: 8, color: "white", opacity: 0.7, textAlign: "center", fontSize: 12 }
});
