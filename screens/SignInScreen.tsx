import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../App";

export default function SignInScreen() {
  const nav = useNavigation<any>();
  const { signInWithEmail, signInWithPhone, verifySmsCode, lastSentSmsCode } = useAuth();

  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const submitEmail = async () => {
    if (!email || !password) return Alert.alert("Ошибка", "Заполните email и пароль.");
    await signInWithEmail(email, password);
  };

  const sendSms = async () => {
    if (!phone) return Alert.alert("Ошибка", "Введите телефон.");
    await signInWithPhone(phone);
  };

  const verify = async () => {
    if (!code) return Alert.alert("Ошибка", "Введите код из СМС.");
    await verifySmsCode(code);
  };

  return (
    <LinearGradient colors={["#ffffff", "#f0f9ff"]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Вход</Text>

        <View style={styles.switcher}>
          <TouchableOpacity style={[styles.swBtn, mode === "email" && styles.swActive]} onPress={() => setMode("email")}>
            <Text style={[styles.swText, mode === "email" && styles.swTextActive]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.swBtn, mode === "phone" && styles.swActive]} onPress={() => setMode("phone")}>
            <Text style={[styles.swText, mode === "phone" && styles.swTextActive]}>Телефон</Text>
          </TouchableOpacity>
        </View>

        {mode === "email" ? (
          <>
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@mail.com" />
            <Input label="Пароль" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
            <TouchableOpacity style={styles.primary} onPress={submitEmail}>
              <Text style={styles.primaryText}>Войти</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Input label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+380..." />
            <TouchableOpacity style={styles.secondary} onPress={sendSms}>
              <Text style={styles.secondaryText}>Отправить код (демо)</Text>
            </TouchableOpacity>

            <Input label="Код из SMS" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="6 цифр" />
            {lastSentSmsCode ? <Text style={styles.hint}>Демо-код: {lastSentSmsCode}</Text> : null}
            <TouchableOpacity style={styles.primary} onPress={verify}>
              <Text style={styles.primaryText}>Подтвердить</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => nav.navigate("SignUp")}>
          <Text style={styles.link}>Нет аккаунта? Зарегистрироваться</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function Input(props: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
      <TextInput {...props} style={[styles.input]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 16, color: "#1f1f1f" },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: "white", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  primary: { backgroundColor: "#0ea5e9", padding: 16, borderRadius: 14, marginTop: 8 },
  primaryText: { color: "white", textAlign: "center", fontWeight: "700", fontSize: 16 },
  secondary: { backgroundColor: "#0284c7", padding: 14, borderRadius: 12, marginBottom: 8 },
  secondaryText: { color: "white", textAlign: "center", fontWeight: "700" },
  link: { textAlign: "center", marginTop: 12, color: "#2563eb", fontWeight: "600" },
  switcher: { flexDirection: "row", backgroundColor: "#e5e7eb", borderRadius: 999, padding: 4, alignSelf: "flex-start", marginBottom: 14 },
  swBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  swActive: { backgroundColor: "white" },
  swText: { color: "#374151", fontWeight: "600" },
  swTextActive: { color: "#111827" },
  hint: { color: "#64748b", marginBottom: 8 }
});
