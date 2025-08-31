import React from "react";
import { SafeAreaView, ScrollView, View, Text, Image, TouchableOpacity, Linking, ImageBackground } from "react-native";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";

import { useProjects } from "../contexts/ProjectsContext";
import { normalizeUrl } from "../utils/url";

const BG_GRADIENTS: Record<string, string[]> = {
  ocean: ["#4facfe", "#00f2fe"], aurora: ["#00c6ff", "#0072ff"], flamingo: ["#F5515F", "#A1051D"],
  lime: ["#A8E063", "#56AB2F"], dusk: ["#0f2027", "#203a43", "#2c5364"], candy: ["#ffecd2", "#fcb69f"],
  grape: ["#7F00FF", "#E100FF"], steel: ["#304352", "#d7d2cc"], sky: ["#36D1DC", "#5B86E5"],
  mango: ["#f7971e", "#ffd200"], blush: ["#e96443", "#904e95"], cobalt: ["#005C97", "#363795"],
  sunset: ["#ee0979", "#ff6a00"],
};

const FONT_MAP = {
  system: { title: undefined, body: undefined, button: undefined },
  inter: { title: "Inter_600SemiBold", body: "Inter_400Regular", button: "Inter_600SemiBold" },
  montserrat: { title: "Montserrat_600SemiBold", body: "Montserrat_400Regular", button: "Montserrat_600SemiBold" },
  playfair: { title: "PlayfairDisplay_700Bold", body: "PlayfairDisplay_400Regular", button: "PlayfairDisplay_700Bold" },
} as const;

function parseColor(spec?: string){ if(!spec) return {outline:false,color:"#111827"}; if(spec.startsWith("outline:")) return {outline:true,color:spec.slice(8)||"#111827"}; return {outline:false,color:spec}; }
function shapeRadius(s?: "pill"|"rounded"|"square"){ if(s==="square") return 8; if(s==="rounded") return 14; return 999; }

export default function PublicViewScreen() {
  const route = useRoute(); const { projectId } = route.params as any;
  const { getProject, registerClick } = useProjects();
  const p = getProject(projectId); if (!p) return null;

  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_600SemiBold,
    Montserrat_400Regular, Montserrat_600SemiBold,
    PlayfairDisplay_400Regular, PlayfairDisplay_700Bold,
  });

  const header = p.headerType || "avatar";
  const bgType = p.bgType || "gradient";
  const gradKey = p.bgValue && BG_GRADIENTS[p.bgValue] ? p.bgValue : "ocean";
  const radius = p.avatarShape === "square" ? 8 : p.avatarShape === "rounded" ? 16 : 999;
  const fonts = FONT_MAP[(p.fontKey as keyof typeof FONT_MAP) || "system"];

  const headerNode = header === "cover" ? (
    <View style={{ marginBottom: 10 }}>
      <ImageBackground source={p.coverUri ? { uri: p.coverUri } : undefined}
        style={{ height: p.coverHeight ?? 150, borderRadius: 16, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
        {p.coverUri && <View style={{ position: "absolute", inset: 0, backgroundColor: `rgba(0,0,0,${p.coverOverlay ?? 0.25})` }} />}
      </ImageBackground>
    </View>
  ) : (
    <View style={{ alignItems: "center", marginBottom: 12 }}>
      <View style={{
        width: p.avatarSize ?? 90, height: p.avatarSize ?? 90,
        borderRadius: radius, overflow: "hidden",
        borderWidth: p.avatarBorderWidth ?? 0, borderColor: p.avatarBorderColor || "#e5e7eb",
        backgroundColor: "#e5e7eb", marginBottom: 8,
      }}>
        {!!p.avatarUri && <Image source={{ uri: p.avatarUri }} style={{ width: "100%", height: "100%" }} />}
      </View>
    </View>
  );

  const titleBlock = (
    <View style={{ alignItems: "center", marginBottom: 12 }}>
      <Text style={{ fontWeight: "700", fontSize: p.titleSize ?? 20, fontFamily: fontsLoaded ? fonts.title : undefined }}>{p.title}</Text>
      {!!p.description && <Text style={{ color: "#475569", textAlign: "center", fontFamily: fontsLoaded ? fonts.body : undefined, fontSize: p.descSize ?? 14 }}>{p.description}</Text>}
    </View>
  );

  const inner = (
    <>
      {headerNode}
      {titleBlock}
      {p.links.map((l) => {
        const kind = l.kind || "link";
        if (kind === "heading") return <Text key={l.id} style={{ marginTop: 6, marginBottom: 4, fontSize: 16, fontWeight: "800", color: "#111827", fontFamily: fontsLoaded ? fonts.title : undefined }}>{l.title}</Text>;
        if (kind === "divider") return <View key={l.id} style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 }} />;

        const { outline, color } = parseColor(l.color);
        const bg = outline ? "transparent" : (color || "#111827");
        const textColor = outline ? (color || "#111827") : "#fff";
        const border = outline ? { borderWidth: 2, borderColor: color || "#111827" } : null;
        const radiusBtn = shapeRadius(l.shape);
        const shadow = l.shadow ? { shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.15, shadowRadius:6, elevation:3 } : null;

        const iconName = (l.icon?.startsWith("fa5:")) ? l.icon.split(":")[1] : (l.icon || "link-outline");
        const isFa = l.icon?.startsWith("fa5:");

        return (
          <TouchableOpacity key={l.id}
            onPress={async () => { await registerClick(p.id, l.id); if (l.url) Linking.openURL(normalizeUrl(l.url)); }}
            style={[{ backgroundColor: bg, padding: 14, borderRadius: radiusBtn, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, border || {}, shadow || {}]}
          >
            {isFa ? <FontAwesome5 name={iconName as any} size={18} color={textColor as any} /> : <Ionicons name={iconName as any} size={18} color={textColor as any} />}
            <Text style={{ color: textColor, fontWeight: "600", fontFamily: fontsLoaded ? fonts.button : undefined, fontSize: p.buttonSize ?? 14 }}>{l.title || "Открыть"}</Text>
          </TouchableOpacity>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {bgType === "solid" ? (
        <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: p.bgValue || "#f8fafc", flexGrow: 1 }}>
          {inner}
        </ScrollView>
      ) : bgType === "image" && p.bgValue ? (
        <ImageBackground source={{ uri: p.bgValue }} style={{ flex: 1 }}>
          <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.1)" }} />
          <ScrollView contentContainerStyle={{ padding: 20 }}>{inner}</ScrollView>
        </ImageBackground>
      ) : (
        <LinearGradient colors={BG_GRADIENTS[gradKey]} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>{inner}</ScrollView>
        </LinearGradient>
      )}
    </SafeAreaView>
  );
}
