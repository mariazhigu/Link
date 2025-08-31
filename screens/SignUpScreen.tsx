import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../App";

export default function SignUpScreen() {
  const nav = useNavigation<any>();
  const { signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | "violet">("violet");
  const [bio, setBio] = useState("");

  const validPassword = (p: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(p);

  const onSubmit = async () => {
    if (!username.trim()) return Alert.alert("Проверьте поля", "Введите имя пользователя.");
    if (!email && !phone) return Alert.alert("Проверьте поля", "Укажите email или телефон.");
    if (email && !/\S+@\S+\.\S+/.test(email)) return Alert.alert("Проверьте поля", "Некорректный email.");
    if (!validPassword(password)) return Alert.alert("Пароль слабый", "Минимум 8 символов, буквы и цифры.");

    await signUp({ username, email, phone, password, theme, bio });
    // после signUp AuthContext сам авторизует
  };

  return (
    <LinearGradient colors={["#ffffff", "#eef2ff"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Регистрация</Text>

        <Input label="Имя пользователя" value={username} onChangeText={setUsername} placeholder="napr. soundwave" />
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@mail.com" />
        <Input label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+380..." />
        <Input label="Пароль" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

        <Text style={styles.label}>Тема профиля</Text>
        <View style={styles.row}>
          {(["light","dark","violet"] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, theme === t && styles.chipActive]}
              onPress={() => setTheme(t)}
            >
              <Text style={[styles.chipText, theme === t && styles.chipTextActive]}>
                {t === "light" ? "Светлая" : t === "dark" ? "Тёмная" : "Фиолетовая"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Био" value={bio} onChangeText={setBio} placeholder="Музыкант 🎵 | Блогер 📸" multiline />

        <TouchableOpacity style={styles.primary} onPress={onSubmit}>
          <Text style={styles.primaryText}>Создать аккаунт</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => nav.navigate("SignIn")}>
          <Text style={styles.link}>Уже есть аккаунт? Войти</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

function Input(props: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
      <TextInput {...props} style={[styles.input, props.multiline && { height: 90, textAlignVertical: "top" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 16, color: "#1f1f1f" },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 6, marginLeft: 2 },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "white" },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { color: "#1f2937", fontWeight: "600" },
  chipTextActive: { color: "white" },
  primary: { backgroundColor: "#4f46e5", padding: 16, borderRadius: 14, marginTop: 8 },
  primaryText: { color: "white", textAlign: "center", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", marginTop: 12, color: "#4f46e5", fontWeight: "600" }
});
