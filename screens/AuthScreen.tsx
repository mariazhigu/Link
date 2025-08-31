import React, { useState } from "react";
import {
  SafeAreaView, Platform, StatusBar, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "../contexts/UserContext";

export default function AuthScreen() {
  const { signInEmail, registerEmail, skipAuth } = useUser();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");

  const onSubmit = async () => {
    try {
      if (!email || !pass) return Alert.alert("Ошибка", "Введите почту и пароль");
      if (mode === "login") await signInEmail(email.trim().toLowerCase(), pass);
      else await registerEmail(email.trim().toLowerCase(), pass, name.trim());
    } catch (e: any) {
      Alert.alert("Ошибка", e.message || String(e));
    }
  };

  return (
    <LinearGradient colors={["#8E2DE2", "#FF416C"]}
      style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, alignItems: "flex-end" }}>
          <TouchableOpacity onPress={skipAuth}
            style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)" }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Пропустить</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
            <View style={{ marginTop: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 34, fontWeight: "800", color: "#fff" }}>LinkPro</Text>
              <Text style={{ color: "#fdf2f8", marginTop: 4 }}>
                {mode === "login" ? "Вход в аккаунт" : "Создание аккаунта"}
              </Text>
            </View>

            <View style={{ backgroundColor: "rgba(255,255,255,0.14)", borderColor: "rgba(255,255,255,0.28)", borderWidth: 1, borderRadius: 24, padding: 18 }}>
              {mode === "register" && (
                <>
                  <Text style={{ color: "#fff", marginBottom: 6, fontWeight: "600" }}>Имя (необязательно)</Text>
                  <TextInput placeholder="Ваше имя" placeholderTextColor="#e5e7eb" value={name} onChangeText={setName}
                    style={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb", color: "#0f172a" }} />
                </>
              )}

              <Text style={{ color: "#fff", marginBottom: 6, fontWeight: "600" }}>Почта</Text>
              <TextInput placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none"
                placeholderTextColor="#e5e7eb" value={email} onChangeText={setEmail}
                style={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb", color: "#0f172a" }} />

              <Text style={{ color: "#fff", marginBottom: 6, fontWeight: "600" }}>Пароль</Text>
              <TextInput placeholder="******" secureTextEntry placeholderTextColor="#e5e7eb"
                value={pass} onChangeText={setPass}
                style={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb", color: "#0f172a" }} />

              <TouchableOpacity onPress={onSubmit}
                style={{ backgroundColor: "#111827", padding: 14, borderRadius: 12, alignItems: "center" }} activeOpacity={0.9}>
                <Text style={{ color: "white", fontWeight: "800" }}>
                  {mode === "login" ? "Войти" : "Зарегистрироваться"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
                <Text style={{ color: "#fff", textAlign: "center", marginTop: 14, fontWeight: "600" }}>
                  {mode === "login" ? "Нет аккаунта? Создать" : "Уже есть аккаунт? Войти"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginTop: 18 }}>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, textAlign: "center" }}>
                Продолжая, вы соглашаетесь с правилами сервиса.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
