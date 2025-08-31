import React, { useEffect, useMemo, useState, memo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import QRCode from "react-native-qrcode-svg";
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

import { useProjects, LinkBtn, Project } from "../contexts/ProjectsContext";
import { useUser } from "../contexts/UserContext";
import { isValidUrl } from "../utils/url";
import { uploadImageToStorage } from "../lib/upload";

type Kind = NonNullable<LinkBtn["kind"]>;
type FontKey = "system" | "inter" | "montserrat" | "playfair";

const label = { fontSize: 12, color: "#6b7280", marginBottom: 6, marginLeft: 2 } as const;
const input = { backgroundColor: "white", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 10 } as const;
const chip = { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "white" } as const;
const chipActive = { backgroundColor: "#4f46e5", borderColor: "#4f46e5" } as const;
const chipText = { color: "#1f2937", fontWeight: "600" } as const;
const chipTextActive = { color: "white" } as const;

const BG_GRADIENTS: Record<string, string[]> = {
  ocean: ["#4facfe", "#00f2fe"], aurora: ["#00c6ff", "#0072ff"], flamingo: ["#F5515F", "#A1051D"],
  lime: ["#A8E063", "#56AB2F"], dusk: ["#0f2027", "#203a43", "#2c5364"], candy: ["#ffecd2", "#fcb69f"],
  grape: ["#7F00FF", "#E100FF"], steel: ["#304352", "#d7d2cc"], sky: ["#36D1DC", "#5B86E5"],
  mango: ["#f7971e", "#ffd200"], blush: ["#e96443", "#904e95"], cobalt: ["#005C97", "#363795"],
  sunset: ["#ee0979", "#ff6a00"],
};
const PALETTE = [
  "#111827","#1f2937","#374151","#4b5563","#6b7280","#9ca3af","#e5e7eb","#ffffff",
  "#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#06b6d4",
  "#3b82f6","#6366f1","#8b5cf6","#a855f7","#ec4899","#f43f5e","#14b8a6","#0ea5e9",
];

const FONT_MAP = {
  system: { title: undefined, body: undefined, button: undefined },
  inter:   { title: "Inter_600SemiBold",   body: "Inter_400Regular",   button: "Inter_600SemiBold" },
  montserrat: { title: "Montserrat_600SemiBold", body: "Montserrat_400Regular", button: "Montserrat_600SemiBold" },
  playfair:   { title: "PlayfairDisplay_700Bold", body: "PlayfairDisplay_400Regular", button: "PlayfairDisplay_700Bold" },
} as const;

function parseColor(spec?: string){ if(!spec) return {outline:false,color:"#111827"}; if(spec.startsWith("outline:")) return {outline:true,color:spec.slice(8)||"#111827"}; return {outline:false,color:spec}; }
function joinColor(outline: boolean, color: string){ return outline ? `outline:${color}` : color; }
function shapeRadius(s?: LinkBtn["shape"]){ if(s==="square") return 8; if(s==="rounded") return 14; return 999; }

const ICON_BANK: Array<{ set: "ion" | "fa5"; name: string; pretty: string }> = [
  { set: "ion", name: "logo-instagram", pretty: "Instagram" },
  { set: "ion", name: "logo-youtube", pretty: "YouTube" },
  { set: "fa5", name: "tiktok", pretty: "TikTok" },
  { set: "ion", name: "logo-twitter", pretty: "X / Twitter" },
  { set: "ion", name: "logo-facebook", pretty: "Facebook" },
  { set: "fa5", name: "facebook-messenger", pretty: "Messenger" },
  { set: "ion", name: "logo-whatsapp", pretty: "WhatsApp" },
  { set: "ion", name: "logo-telegram", pretty: "Telegram" },
  { set: "fa5", name: "soundcloud", pretty: "SoundCloud" },
  { set: "fa5", name: "spotify", pretty: "Spotify" },
  { set: "ion", name: "logo-apple", pretty: "Apple Music" },
  { set: "ion", name: "logo-vk", pretty: "VK" },
  { set: "fa5", name: "twitch", pretty: "Twitch" },
  { set: "fa5", name: "discord", pretty: "Discord" },
  { set: "ion", name: "logo-github", pretty: "GitHub" },
  { set: "ion", name: "mail-outline", pretty: "Email" },
  { set: "ion", name: "globe-outline", pretty: "Website" },
  { set: "ion", name: "call-outline", pretty: "Phone" },
  { set: "ion", name: "document-attach-outline", pretty: "File" },
  { set: "ion", name: "musical-notes-outline", pretty: "Music" },
  { set: "ion", name: "play-circle-outline", pretty: "Video" },
  { set: "ion", name: "reader-outline", pretty: "Heading" },
  { set: "ion", name: "link-outline", pretty: "Link" },
];

export default function ProjectDashboard(){
  const route = useRoute(); const navigation = useNavigation<any>();
  const { projectId } = route.params as any;
  const { user } = useUser();
  const { getProject, updateProject, setLinksOrder, getPublicUrl, getDailyClicks, preloadDailyClicks, refresh } = useProjects();
  const project = getProject(projectId);

  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_600SemiBold,
    Montserrat_400Regular, Montserrat_600SemiBold,
    PlayfairDisplay_400Regular, PlayfairDisplay_700Bold,
  });

  // ---- локальные состояния верхнего блока ----
  const [draftTitle, setDraftTitle] = useState(project?.title || "");
  const [draftDesc, setDraftDesc]   = useState(project?.description || "");

  const [avatarSizeLocal, setAvatarSizeLocal]       = useState(project?.avatarSize ?? 90);
  const [avatarBorderLocal, setAvatarBorderLocal]   = useState(project?.avatarBorderWidth ?? 0);
  const [coverHeightLocal, setCoverHeightLocal]     = useState(project?.coverHeight ?? 150);
  const [coverOverlayLocal, setCoverOverlayLocal]   = useState(project?.coverOverlay ?? 0.25);

  const [fontKeyLocal, setFontKeyLocal] = useState<FontKey>((project?.fontKey as FontKey) || "system");
  const [titleSizeLocal, setTitleSizeLocal] = useState(project?.titleSize ?? 18);
  const [descSizeLocal, setDescSizeLocal]   = useState(project?.descSize ?? 14);
  const [btnSizeLocal, setBtnSizeLocal]     = useState(project?.buttonSize ?? 14);

  const [qrOpen, setQrOpen] = useState(false);
  const [gradPickerOpen, setGradPickerOpen] = useState(false);
  const [colorModal, setColorModal] = useState<{ open: boolean; onPick?: (hex: string)=>void; initial?: string }>({ open: false });
  const [iconModal, setIconModal] = useState<{ open: boolean; linkId?: string }>({ open: false });
  const [iconQuery, setIconQuery] = useState("");

  // управление прокруткой во время движения слайдеров
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(()=>{ if(!project) refresh(); },[project?.id]);
  useEffect(()=>{ if(project) preloadDailyClicks(project.id,7); },[project?.id]);

  useEffect(() => {
    if (!project) return;
    setDraftTitle(project.title || "");
    setDraftDesc(project.description || "");

    setAvatarSizeLocal(project.avatarSize ?? 90);
    setAvatarBorderLocal(project.avatarBorderWidth ?? 0);
    setCoverHeightLocal(project.coverHeight ?? 150);
    setCoverOverlayLocal(project.coverOverlay ?? 0.25);

    setFontKeyLocal((project.fontKey as FontKey) || "system");
    setTitleSizeLocal(project.titleSize ?? 18);
    setDescSizeLocal(project.descSize ?? 14);
    setBtnSizeLocal(project.buttonSize ?? 14);
  }, [project?.id]);

  if (!project) {
    return <SafeAreaView style={{flex:1,alignItems:"center",justifyContent:"center"}}><ActivityIndicator/><Text style={{marginTop:8}}>Загружаем проект…</Text></SafeAreaView>;
  }

  const { labels, counts } = getDailyClicks(project.id,7);

  // выбор фото (аватар/обложка/фон)
  const pickAndUpload = async (tag: "avatar"|"cover"|"bg") => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Нет доступа", "Разрешите доступ к фото"); return; }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images, // без deprecated
        allowsEditing: false,
        quality: 0.92,
      });
      if (res.canceled) return;

      const url = await uploadImageToStorage(res.assets[0].uri, user?.id, tag);
      if (tag === "avatar") await updateProject(project.id, { avatarUri: url });
      if (tag === "cover")  await updateProject(project.id, { coverUri: url });
      if (tag === "bg")     await updateProject(project.id, { bgType: "image", bgValue: url });
    } catch (e:any) {
      Alert.alert("Не удалось загрузить", e?.message || String(e));
    }
  };

  const commitTitle   = async () => { if (draftTitle !== project.title) await updateProject(project.id, { title: draftTitle }); };
  const commitDesc    = async () => { if (draftDesc !== project.description) await updateProject(project.id, { description: draftDesc }); };

  const updateLink = async (idx: number, patch: Partial<LinkBtn>) => {
    const links = project.links.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    await updateProject(project.id, { links });
  };
  const removeLink = async (idx: number) => {
    const links = project.links.filter((_, i) => i !== idx);
    await updateProject(project.id, { links });
  };

  const Header = () => {
    const hdr = project.headerType || "avatar";
    const avatarRadius = project.avatarShape==="square"?8: project.avatarShape==="rounded"?16:999;
    const fontKey = fontKeyLocal;

    return (
      <View style={{ paddingHorizontal:20 }}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <Text style={{ fontSize:22, fontWeight:"700" }}>Редактор проекта</Text>
          <View style={{ flexDirection:"row", gap:12, alignItems:"center" }}>
            <TouchableOpacity onPress={()=>setQrOpen(true)} style={{ flexDirection:"row", gap:6, alignItems:"center" }}>
              <Ionicons name="qr-code-outline" size={18} color="#2563eb" />
              <Text style={{ color:"#2563eb", fontWeight:"600" }}>QR</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>navigation.navigate("PublicView",{ projectId: project.id })} style={{ flexDirection:"row", gap:6, alignItems:"center" }}>
              <Ionicons name="eye-outline" size={18} color="#2563eb" />
              <Text style={{ color:"#2563eb", fontWeight:"600" }}>Превью</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Тип шапки */}
        <Text style={label}>Тип шапки</Text>
        <View style={{ flexDirection:"row", gap:8, marginBottom:8 }}>
          {(["avatar","cover"] as ("avatar"|"cover")[]).map(t=>(
            <TouchableOpacity key={t} onPress={()=>updateProject(project.id,{ headerType:t })} style={[chip, (hdr===t)&&chipActive]}>
              <Text style={[chipText, (hdr===t)&&chipTextActive]}>{t==="avatar"?"Аватар":"Обложка"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {hdr==="avatar" ? (
          <View style={{ alignItems:"center", marginBottom:12 }}>
            <View style={{
              width: avatarSizeLocal, height: avatarSizeLocal,
              borderRadius: avatarRadius, overflow:"hidden",
              borderWidth: avatarBorderLocal,
              borderColor: project.avatarBorderColor || "#e5e7eb",
              backgroundColor:"#e5e7eb", marginBottom:10,
            }}>
              {!!project.avatarUri && <Image source={{ uri: project.avatarUri }} style={{ width:"100%", height:"100%" }} />}
            </View>

            <View style={{ flexDirection:"row", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
              <TouchableOpacity onPress={()=>pickAndUpload("avatar")} style={{ backgroundColor:"#111827", paddingHorizontal:14, paddingVertical:10, borderRadius:10 }}>
                <Text style={{ color:"white", fontWeight:"800" }}>Выбрать фото</Text>
              </TouchableOpacity>
              {!!project.avatarUri && (
                <TouchableOpacity onPress={()=>updateProject(project.id,{ avatarUri: undefined })} style={{ backgroundColor:"#fee2e2", paddingHorizontal:14, paddingVertical:10, borderRadius:10 }}>
                  <Text style={{ color:"#b91c1c", fontWeight:"800" }}>Удалить</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[label,{ marginTop:12 }]}>Форма</Text>
            <View style={{ flexDirection:"row", gap:8 }}>
              {(["circle","rounded","square"] as ("circle"|"rounded"|"square")[]).map(s=>(
                <TouchableOpacity key={s} onPress={()=>updateProject(project.id,{ avatarShape:s })} style={[chip, (project.avatarShape||"circle")===s && chipActive]}>
                  <Text style={[chipText, (project.avatarShape||"circle")===s && chipTextActive]}>{s==="circle"?"Круг":s==="rounded"?"Скругл.":"Квадрат"}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ width:"100%" }}>
              <Text style={[label,{ marginTop:10 }]}>Размер аватара: {avatarSizeLocal}px</Text>
              <Slider
                minimumValue={60} maximumValue={160} step={2} value={avatarSizeLocal}
                onSlidingStart={()=>setScrollEnabled(false)}
                onValueChange={(v)=>setAvatarSizeLocal(Math.round(v))}
                onSlidingComplete={(v)=>{ setScrollEnabled(true); updateProject(project.id,{ avatarSize: Math.round(v) }); }}
              />
              <Text style={[label,{ marginTop:8 }]}>Толщина рамки: {avatarBorderLocal}px</Text>
              <Slider
                minimumValue={0} maximumValue={12} step={1} value={avatarBorderLocal}
                onSlidingStart={()=>setScrollEnabled(false)}
                onValueChange={(v)=>setAvatarBorderLocal(Math.round(v))}
                onSlidingComplete={(v)=>{ setScrollEnabled(true); updateProject(project.id,{ avatarBorderWidth: Math.round(v) }); }}
              />
            </View>

            <TouchableOpacity
              onPress={()=> setColorModal({ open:true, initial: project.avatarBorderColor || "#e5e7eb", onPick:(hex)=>updateProject(project.id,{ avatarBorderColor: hex }) })}
              style={{ marginTop:8, alignSelf:"center", flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#eef2ff", paddingHorizontal:12, paddingVertical:10, borderRadius:10 }}
            >
              <View style={{ width:18, height:18, borderRadius:4, backgroundColor: project.avatarBorderColor || "#e5e7eb", borderWidth:1, borderColor:"#e5e7eb" }} />
              <Text style={{ color:"#4f46e5", fontWeight:"700" }}>Цвет рамки</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom:12 }}>
            <View style={{ height: coverHeightLocal, borderRadius:14, overflow:"hidden", backgroundColor:"#e5e7eb", justifyContent:"center", alignItems:"center" }}>
              {project.coverUri ? (
                <>
                  <ImageBackground source={{ uri: project.coverUri }} style={{ width:"100%", height:"100%" }} />
                  <View style={{ position:"absolute", inset:0, backgroundColor:`rgba(0,0,0,${coverOverlayLocal})` }} />
                </>
              ) : <Text style={{ color:"#64748b" }}>Обложка не выбрана</Text>}
            </View>

            <View style={{ flexDirection:"row", gap:10, marginTop:8, flexWrap:"wrap" }}>
              <TouchableOpacity onPress={()=>pickAndUpload("cover")} style={{ backgroundColor:"#111827", paddingHorizontal:14, paddingVertical:10, borderRadius:10 }}>
                <Text style={{ color:"white", fontWeight:"800" }}>Выбрать фото</Text>
              </TouchableOpacity>
              {!!project.coverUri && (
                <TouchableOpacity onPress={()=>updateProject(project.id,{ coverUri: undefined })} style={{ backgroundColor:"#fee2e2", paddingHorizontal:14, paddingVertical:10, borderRadius:10 }}>
                  <Text style={{ color:"#b91c1c", fontWeight:"800" }}>Удалить</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ width:"100%" }}>
              <Text style={[label,{ marginTop:10 }]}>Высота обложки: {coverHeightLocal}px</Text>
              <Slider
                minimumValue={120} maximumValue={280} step={2} value={coverHeightLocal}
                onSlidingStart={()=>setScrollEnabled(false)}
                onValueChange={(v)=>setCoverHeightLocal(Math.round(v))}
                onSlidingComplete={(v)=>{ setScrollEnabled(true); updateProject(project.id,{ coverHeight: Math.round(v) }); }}
              />
              <Text style={[label,{ marginTop:8 }]}>Затемнение: {coverOverlayLocal.toFixed(2)}</Text>
              <Slider
                minimumValue={0} maximumValue={0.6} step={0.02} value={coverOverlayLocal}
                onSlidingStart={()=>setScrollEnabled(false)}
                onValueChange={(v)=>setCoverOverlayLocal(Number((v as number).toFixed(2)))}
                onSlidingComplete={(v)=>{ setScrollEnabled(true); updateProject(project.id,{ coverOverlay: Number((v as number).toFixed(2)) }); }}
              />
            </View>
          </View>
        )}

        {/* Текст под шапкой */}
        <Text style={label}>Заголовок</Text>
        <TextInput
          style={[input, { fontFamily: fontsLoaded ? FONT_MAP[fontKey].title : undefined, fontSize: titleSizeLocal }]}
          value={draftTitle}
          onChangeText={setDraftTitle}
          onBlur={commitTitle}
        />
        <Text style={label}>Описание</Text>
        <TextInput
          style={[input, { height: 90, textAlignVertical: "top", fontFamily: fontsLoaded ? FONT_MAP[fontKey].body : undefined, fontSize: descSizeLocal }]}
          multiline
          value={draftDesc}
          onChangeText={setDraftDesc}
          onBlur={commitDesc}
        />

        {/* Типографика */}
        <Text style={label}>Шрифт</Text>
        <View style={{ flexDirection:"row", gap:8, marginBottom:8, flexWrap:"wrap" }}>
          {(["system","inter","montserrat","playfair"] as FontKey[]).map(k=>(
            <TouchableOpacity key={k} onPress={()=> { setFontKeyLocal(k); updateProject(project.id,{ fontKey: k }); }} style={[chip, (fontKey===k)&&chipActive]}>
              <Text style={[chipText, (fontKey===k)&&chipTextActive]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ width:"100%" }}>
          <Text style={[label]}>Размер заголовка: {titleSizeLocal}px</Text>
          <Slider minimumValue={16} maximumValue={28} step={1} value={titleSizeLocal}
            onSlidingStart={()=>setScrollEnabled(false)}
            onValueChange={(v)=>setTitleSizeLocal(Math.round(v))}
            onSlidingComplete={(v)=>{ setScrollEnabled(true); updateProject(project.id,{ titleSize: Math.round(v) }); }} />
          <Text style={[label,{ marginTop:8 }]}>Размер описания: {descSizeLocal}px</Text>
          <Slider minimumValue={12} maximumValue={20} step={1} value={descSizeLocal}
            onSlidingStart={()=>setScrollEnabled(false)}
            onValueChange={(v)=>setDescSizeLocal(Math.round(v))}
            onSlidingComplete={(v)=>{ setScrollEnabled(true); updateProject(project.id,{ descSize: Math.round(v) }); }} />
          <Text style={[label,{ marginTop:8 }]}>Размер текста кнопок: {btnSizeLocal}px</Text>
          <Slider minimumValue={12} maximumValue={20} step={1} value={btnSizeLocal}
            onSlidingStart={()=>setScrollEnabled(false)}
            onValueChange={(v)=>setBtnSizeLocal(Math.round(v))}
            onSlidingComplete={(v)=>{ setScrollEnabled(true); updateProject(project.id,{ buttonSize: Math.round(v) }); }} />
        </View>

        {/* Фон страницы */}
        <Text style={[label,{ marginTop:8 }]}>Фон страницы</Text>
        <View style={{ flexDirection:"row", gap:8, flexWrap:"wrap", marginBottom:8 }}>
          {(["gradient","solid","image"] as NonNullable<Project["bgType"]>[]).map(t=>(
            <TouchableOpacity key={t} onPress={()=>updateProject(project.id,{ bgType:t })} style={[chip, (project.bgType||"gradient")===t && chipActive]}>
              <Text style={[chipText, (project.bgType||"gradient")===t && chipTextActive]}>{t==="gradient"?"Градиент":t==="solid"?"Цвет":"Фото"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {(project.bgType||"gradient")==="gradient" && (
          <TouchableOpacity onPress={()=>setGradPickerOpen(true)} style={[input,{ flexDirection:"row", alignItems:"center", gap:10 }]}>
            <View style={{ width:60, height:30, borderRadius:8, overflow:"hidden" }}>
              <LinearGradient colors={BG_GRADIENTS[project.bgValue || "ocean"] || BG_GRADIENTS["ocean"]} style={{ flex:1 }} />
            </View>
            <Text style={{ color:"#111827", fontWeight:"600" }}>{project.bgValue || "ocean"}</Text>
            <Ionicons name="chevron-down" size={18} color="#6b7280" style={{ marginLeft:"auto" }} />
          </TouchableOpacity>
        )}

        {(project.bgType||"gradient")==="solid" && (
          <TouchableOpacity
            onPress={()=> setColorModal({ open:true, initial: project.bgValue || "#f8fafc", onPick:(hex)=>updateProject(project.id,{ bgValue: hex }) })}
            style={[input,{ flexDirection:"row", alignItems:"center", gap:10 }]}
          >
            <View style={{ width:30, height:30, borderRadius:6, backgroundColor: project.bgValue || "#f8fafc", borderWidth:1, borderColor:"#e5e7eb" }} />
            <Text style={{ color:"#111827", fontWeight:"600" }}>Выбрать цвет</Text>
          </TouchableOpacity>
        )}

        {(project.bgType||"gradient")==="image" && (
          <View style={{ flexDirection:"row", gap:10, alignItems:"center", marginBottom:8 }}>
            <TouchableOpacity onPress={()=>pickAndUpload("bg")} style={{ backgroundColor:"#111827", paddingVertical:10, paddingHorizontal:14, borderRadius:10 }}>
              <Text style={{ color:"white", fontWeight:"800" }}>Выбрать фото</Text>
            </TouchableOpacity>
            {project.bgValue ? <Text style={{ color:"#334155", flex:1 }} numberOfLines={1}>{project.bgValue}</Text> : <Text style={{ color:"#64748b" }}>Пока не выбрано</Text>}
          </View>
        )}

        {/* Превью */}
        <View style={{ marginBottom:12 }}>{renderPreview(project, fontsLoaded ? FONT_MAP[fontKey] : FONT_MAP["system"], btnSizeLocal)}</View>

        {/* Быстрые блоки */}
        <Text style={{ fontSize:18, fontWeight:"700", marginVertical:8 }}>Добавить блок</Text>
        <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10, marginBottom:8 }}>
          <QuickButton label="+ Кнопка" onPress={()=>updateProject(project.id,{ links:[...project.links, { id:String(Date.now()), kind:"link", title:"Новая кнопка", url:"", icon:"link-outline", shape:"pill", shadow:true }]})} />
          <QuickButton label="+ Заголовок" onPress={()=>updateProject(project.id,{ links:[...project.links, { id:String(Date.now()), kind:"heading", title:"Заголовок секции", url:"" }]})} />
          <QuickButton label="+ Разделитель" onPress={()=>updateProject(project.id,{ links:[...project.links, { id:String(Date.now()), kind:"divider", title:"", url:"" }]})} />
        </View>

        <View style={{ height:8 }} />
      </View>
    );
  };

  // ---- Элемент списка ссылок (мемо) — чтобы ввод не закрывал клавиатуру ----
  const LinkEditorItem = memo(function LinkEditorItem({
    item, index, onChange, onRemove, openColorModal, openIconModal, buttonTextSize
  }: {
    item: LinkBtn;
    index: number;
    onChange: (patch: Partial<LinkBtn>) => void;
    onRemove: () => void;
    openColorModal: (initial: string, apply: (hex:string)=>void) => void;
    openIconModal: () => void;
    buttonTextSize: number;
  }) {
    const kind = item.kind || "link";
    const [title, setTitle] = useState(item.title || "");
    const [url, setUrl] = useState(item.url || "");

    useEffect(()=>{ setTitle(item.title || ""); },[item.title]);
    useEffect(()=>{ setUrl(item.url || ""); },[item.url]);

    const invalidUrl = !!url && kind!=="heading" && kind!=="divider" && !isValidUrl(url);
    const { outline, color } = parseColor(item.color);

    return (
      <View style={{ backgroundColor:"white", borderRadius:12, padding:12, marginBottom:10, borderWidth:1, borderColor: invalidUrl ? "#fca5a5" : "#e5e7eb" }}>
        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <Text style={{ fontWeight:"700", color:"#111827" }}>
            {kind==="link"?"Кнопка":kind==="heading"?"Заголовок":"Разделитель"}
          </Text>
          <TouchableOpacity onPress={onRemove} style={{ backgroundColor:"#fee2e2", paddingVertical:6, paddingHorizontal:10, borderRadius:8 }}>
            <Text style={{ color:"#b91c1c", fontWeight:"800" }}>Удалить</Text>
          </TouchableOpacity>
        </View>

        {/* тип */}
        <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:8 }}>
          {(["link","heading","divider"] as Kind[]).map(k=>(
            <TouchableOpacity key={k} onPress={()=>onChange({kind:k})} style={[chip, (kind===k)&&chipActive]}>
              <Text style={[chipText, (kind===k)&&chipTextActive]}>
                {k==="link"?"Кнопка":k==="heading"?"Заголовок":"Разделитель"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {kind!=="divider" && (
          <>
            {kind!=="heading" && (
              <>
                <TextInput
                  style={[input,{ borderColor: invalidUrl ? "#fca5a5" : "#e5e7eb" }]}
                  placeholder="https://…"
                  value={url}
                  onChangeText={setUrl}
                  onBlur={()=> onChange({ url })}
                  autoCapitalize="none"
                />
                {invalidUrl && <Text style={{ color:"#b91c1c", fontSize:12, marginTop:-6, marginBottom:6 }}>Проверь URL</Text>}
              </>
            )}

            <TextInput
              style={[input,{ marginTop:2 }]}
              placeholder={kind==="heading"?"Текст заголовка":"Текст на кнопке"}
              value={title}
              onChangeText={setTitle}
              onBlur={()=> onChange({ title })}
            />
          </>
        )}

        {kind==="link" && (
          <>
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10, alignItems:"center", marginTop:4 }}>
              <TouchableOpacity
                onPress={openIconModal}
                style={{ backgroundColor:"#eef2ff", paddingHorizontal:12, paddingVertical:10, borderRadius:10, flexDirection:"row", alignItems:"center", gap:8 }}
              >
                <Ionicons name={item.icon?.startsWith("fa5:") ? "apps-outline" : (item.icon as any) || "link-outline"} size={18} color="#4f46e5" />
                <Text style={{ color:"#4f46e5", fontWeight:"700" }}>Иконка</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={()=> openColorModal(parseColor(item.color).color, (hex)=>onChange({ color: joinColor(parseColor(item.color).outline, hex) }))}
                style={{ backgroundColor:"#eef2ff", paddingHorizontal:12, paddingVertical:10, borderRadius:10, flexDirection:"row", alignItems:"center", gap:8 }}
              >
                <View style={{ width:18, height:18, borderRadius:4, backgroundColor: parseColor(item.color).color, borderWidth:1, borderColor:"#e5e7eb" }} />
                <Text style={{ color:"#4f46e5", fontWeight:"700" }}>Цвет</Text>
              </TouchableOpacity>

              <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                <Switch value={parseColor(item.color).outline} onValueChange={(v)=>onChange({ color: joinColor(v, parseColor(item.color).color) })} />
                <Text style={{ color:"#334155" }}>Обводка</Text>
              </View>

              <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                <Switch value={!!item.shadow} onValueChange={(v)=>onChange({ shadow: v })} />
                <Text style={{ color:"#334155" }}>Тень</Text>
              </View>
            </View>

            <View style={{ flexDirection:"row", gap:8, marginTop:10, flexWrap:"wrap" }}>
              {(["pill","rounded","square"] as NonNullable<LinkBtn["shape"]>[]).map(sh=>(
                <TouchableOpacity key={sh} onPress={()=>onChange({ shape: sh })} style={[chip, (item.shape||"pill")===sh && chipActive]}>
                  <Text style={[chipText, (item.shape||"pill")===sh && chipTextActive]}>{sh==="pill"?"Pill":sh==="rounded"?"Rounded":"Square"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    );
  });

  const Footer = ()=>{
    const totalClicks = project.links.reduce((a,l)=>a+(l.clicks||0),0);
    return (
      <View style={{ paddingHorizontal:20, paddingBottom:20 }}>
        <View style={{ marginTop:8, backgroundColor:"#f1f5f9", padding:12, borderRadius:12 }}>
          <Text style={{ fontWeight:"700" }}>Аналитика (7 дней)</Text>
          <View style={{ flexDirection:"row", alignItems:"flex-end", gap:6, marginTop:8 }}>
            {counts.map((c,i)=>(
              <View key={i} style={{ alignItems:"center" }}>
                <View style={{ width:16, height: 4 + (60 * c) / Math.max(1, ...counts), backgroundColor:"#4f46e5", borderRadius:4 }} />
                <Text style={{ fontSize:10, color:"#475569", marginTop:4 }}>{labels[i]}</Text>
              </View>
            ))}
          </View>
          <Text style={{ color:"#334155", marginTop:6 }}>Всего кликов: {totalClicks}</Text>
        </View>
      </View>
    );
  };

  const ListHeaderComponent = Header;
  const ListFooterComponent = Footer;

  const renderFlatItem = ({ item, index }: { item: LinkBtn; index: number }) => (
    <LinkEditorItem
      item={item}
      index={index}
      buttonTextSize={btnSizeLocal}
      onChange={(patch)=> updateLink(index, patch)}
      onRemove={()=> removeLink(index)}
      openColorModal={(initial, apply)=> setColorModal({ open:true, initial, onPick:(hex)=>{ apply(hex); setColorModal({ open:false }); } })}
      openIconModal={()=> setIconModal({ open:true, linkId: item.id })}
    />
  );

  return (
    <SafeAreaView style={{ flex:1, paddingTop: Platform.OS==="android" ? StatusBar.currentHeight : 0 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          data={project.links}
          keyExtractor={(item)=>item.id}
          renderItem={renderFlatItem}
          ListHeaderComponent={<Header/>}
          ListFooterComponent={<Footer/>}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          scrollEnabled={scrollEnabled}
          contentContainerStyle={{ paddingTop:0, paddingBottom:20, paddingHorizontal:20 }}
        />
      </KeyboardAvoidingView>

      {/* Пикер градиента */}
      <GradientPickerModal
        visible={gradPickerOpen}
        value={project.bgValue || "ocean"}
        onClose={()=>setGradPickerOpen(false)}
        onPick={(key)=>{ setGradPickerOpen(false); updateProject(project.id,{ bgValue:key }); }}
      />

      {/* Пикер цвета */}
      <ColorPickerModal
        visible={colorModal.open}
        initial={colorModal.initial}
        onClose={()=>setColorModal({ open:false })}
        onPick={(hex)=>{ setColorModal({ open:false }); colorModal.onPick?.(hex); }}
      />

      {/* Пикер иконок */}
      <IconPickerModal
        visible={iconModal.open}
        query={iconQuery}
        onQueryChange={setIconQuery}
        onClose={()=>{ setIconModal({ open:false, linkId: undefined }); setIconQuery(""); }}
        onPick={(iconName, setName)=>{
          const id = iconModal.linkId; if(!id) return;
          const idx = project.links.findIndex(l=>l.id===id);
          if (idx>=0){
            const icon = setName==="fa5" ? (`fa5:${iconName}`) : iconName;
            const links = project.links.map((l,i)=> i===idx ? {...l, icon} : l);
            updateProject(project.id,{ links });
          }
          setIconModal({ open:false, linkId: undefined }); setIconQuery("");
        }}
      />

      {/* QR */}
      <Modal visible={qrOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={()=>setQrOpen(false)}>
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", alignItems:"center", justifyContent:"center" }}>
          <View style={{ backgroundColor:"white", borderRadius:16, padding:20, alignItems:"center" }}>
            <Text style={{ fontWeight:"700", marginBottom:12 }}>QR-код вашей страницы</Text>
            <QRCode value={getPublicUrl(project)} size={220} />
            <TouchableOpacity onPress={()=>setQrOpen(false)} style={{ marginTop:16 }}>
              <Text style={{ color:"#2563eb", fontWeight:"700" }}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function renderPreview(project: Project, fonts: {title?:string; body?:string; button?:string}, btnSize: number){
  const header = project.headerType || "avatar";
  const radius = project.avatarShape==="square"?8: project.avatarShape==="rounded"?16:999;

  const headerNode = header==="cover" ? (
    <View style={{ marginBottom:10 }}>
      <ImageBackground source={project.coverUri ? { uri: project.coverUri } : undefined}
        style={{ height: project.coverHeight ?? 150, borderRadius:16, overflow:"hidden", backgroundColor:"#e5e7eb" }}>
        {project.coverUri && <View style={{ position:"absolute", inset:0, backgroundColor:`rgba(0,0,0,${project.coverOverlay ?? 0.25})` }} />}
      </ImageBackground>
    </View>
  ) : (
    <View style={{ alignItems:"center", marginBottom:12 }}>
      <View style={{
        width: project.avatarSize ?? 90, height: project.avatarSize ?? 90,
        borderRadius: radius, overflow:"hidden",
        borderWidth: project.avatarBorderWidth ?? 0, borderColor: project.avatarBorderColor || "#e5e7eb",
        backgroundColor:"#e5e7eb", marginBottom:8,
      }}>
        {!!project.avatarUri && <Image source={{ uri: project.avatarUri }} style={{ width:"100%", height:"100%" }} />}
      </View>
    </View>
  );

  const titleBlock = (
    <View style={{ alignItems:"center", marginBottom:12 }}>
      <Text style={{ fontWeight:"700", fontSize: project.titleSize ?? 18, fontFamily: fonts.title }}>{project.title}</Text>
      {!!project.description && <Text style={{ color: "#475569", textAlign: "center", fontSize: project.descSize ?? 14, fontFamily: fonts.body }}>{project.description}</Text>}
    </View>
  );

  const innerButtons = project.links.map((l)=>{
    const kind = l.kind || "link";
    if (kind==="heading") return <View key={l.id} style={{ marginTop:6, marginBottom:4 }}><Text style={{ fontSize:16, fontWeight:"800", color:"#111827", fontFamily: fonts.title }}>{l.title || "Заголовок"}</Text></View>;
    if (kind==="divider") return <View key={l.id} style={{ height:1, backgroundColor:"#e5e7eb", marginVertical:8 }} />;

    const { outline, color } = parseColor(l.color);
    const bg = outline ? "transparent" : (color || "#111827");
    const textColor = outline ? (color || "#111827") : "#fff";
    const border = outline ? { borderWidth:2, borderColor: color || "#111827" } : null;
    const radiusBtn = shapeRadius(l.shape);
    const shadow = l.shadow ? { shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.15, shadowRadius:6, elevation:3 } : null;

    const iconName = (l.icon?.startsWith("fa5:")) ? l.icon.split(":")[1] : (l.icon || "link-outline");
    const isFa = l.icon?.startsWith("fa5:");

    return (
      <View key={l.id} style={[{ backgroundColor:bg, padding:14, borderRadius:radiusBtn, marginBottom:10, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 }, border||{}, shadow||{}]}>
        {isFa ? <FontAwesome5 name={iconName as any} size={18} color={textColor as any} /> : <Ionicons name={iconName as any} size={18} color={textColor as any} />}
        <Text style={{ color:textColor, fontWeight:"600", fontFamily: fonts.button, fontSize: btnSize }}>{l.title || "Открыть"}</Text>
      </View>
    );
  });

  const inner = (<View>{headerNode}{titleBlock}{innerButtons}</View>);

  if((project.bgType||"gradient")==="solid"){
    return <View style={{ backgroundColor: project.bgValue || "#f8fafc", borderRadius:16, padding:16 }}>{inner}</View>;
  }
  if((project.bgType||"gradient")==="image" && project.bgValue){
    return (
      <ImageBackground source={{ uri: project.bgValue }} imageStyle={{ borderRadius:16 }} style={{ borderRadius:16, padding:16, overflow:"hidden" }}>
        <View style={{ position:"absolute", inset:0, backgroundColor:"rgba(0,0,0,0.1)" }} />
        {inner}
      </ImageBackground>
    );
  }
  const key = project.bgValue && BG_GRADIENTS[project.bgValue] ? project.bgValue : "ocean";
  return <LinearGradient colors={BG_GRADIENTS[key]} style={{ borderRadius:16, padding:16 }}>{inner}</LinearGradient>;
}

function QuickButton({ label, onPress }:{ label:string; onPress:()=>void }){
  return <TouchableOpacity onPress={onPress} style={{ backgroundColor:"#111827", paddingVertical:10, paddingHorizontal:14, borderRadius:10 }}><Text style={{ color:"#fff", fontWeight:"800" }}>{label}</Text></TouchableOpacity>;
}

function GradientPickerModal({ visible, value, onPick, onClose }:{ visible:boolean; value:string; onPick:(key:string)=>void; onClose:()=>void }){
  const keys = Object.keys(BG_GRADIENTS);
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.35)", justifyContent:"flex-end" }}>
        <TouchableOpacity style={{ flex:1 }} activeOpacity={1} onPress={onClose} />
        <View style={{ backgroundColor:"white", padding:16, borderTopLeftRadius:16, borderTopRightRadius:16, maxHeight:"60%" }}>
          <Text style={{ fontWeight:"700", fontSize:16, marginBottom:8 }}>Выберите градиент</Text>
          <FlatList
            data={keys}
            keyExtractor={(k)=>k}
            keyboardShouldPersistTaps="always"
            renderItem={({ item })=>(
              <TouchableOpacity onPress={()=>onPick(item)} style={{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:8 }}>
                <View style={{ width:80, height:36, borderRadius:10, overflow:"hidden", borderWidth: value===item?2:1, borderColor: value===item?"#4f46e5":"#e5e7eb" }}>
                  <LinearGradient colors={BG_GRADIENTS[item]} style={{ flex:1 }} />
                </View>
                <Text style={{ fontWeight:"600", color:"#111827" }}>{item}</Text>
                {value===item && <Ionicons name="checkmark-circle" size={18} color="#22c55e" style={{ marginLeft:"auto" }} />}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={onClose} style={{ alignItems:"center", padding:12 }}>
            <Text style={{ color:"#2563eb", fontWeight:"700" }}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ColorPickerModal({ visible, onPick, onClose, initial }:{ visible:boolean; onPick:(hex:string)=>void; onClose:()=>void; initial?:string }){
  const [custom, setCustom] = useState(initial || "");
  useEffect(()=>{ setCustom(initial || ""); },[initial, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.35)", justifyContent:"flex-end" }}>
        <TouchableOpacity style={{ flex:1 }} activeOpacity={1} onPress={onClose} />
        <View style={{ backgroundColor:"white", padding:16, borderTopLeftRadius:16, borderTopRightRadius:16 }}>
          <Text style={{ fontWeight:"700", fontSize:16, marginBottom:8 }}>Выберите цвет</Text>
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10 }}>
            {PALETTE.map((hex)=>(
              <TouchableOpacity key={hex} onPress={()=>onPick(hex)} style={{ width:34, height:34, borderRadius:8, backgroundColor:hex, borderWidth:1, borderColor:"#e5e7eb" }} />
            ))}
          </View>
          <Text style={[label,{ marginTop:10 }]}>Свой HEX</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
            <View style={{ width:30, height:30, borderRadius:6, backgroundColor: custom || "#ffffff", borderWidth:1, borderColor:"#e5e7eb" }} />
            <TextInput style={[input,{ flex:1, marginBottom:0 }]} placeholder="#RRGGBB" autoCapitalize="none" value={custom} onChangeText={setCustom} />
            <TouchableOpacity onPress={()=>custom && onPick(custom)} style={{ paddingVertical:10, paddingHorizontal:14, backgroundColor:"#111827", borderRadius:10 }}>
              <Text style={{ color:"#fff", fontWeight:"800" }}>Ок</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={{ alignItems:"center", padding:12 }}>
            <Text style={{ color:"#2563eb", fontWeight:"700" }}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function IconPickerModal({
  visible, onClose, onPick, query, onQueryChange,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (name: string, setName: "ion" | "fa5") => void;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const filtered = useMemo(()=>{
    const q = query.toLowerCase().trim();
    if(!q) return ICON_BANK;
    return ICON_BANK.filter(x => x.name.toLowerCase().includes(q) || x.pretty.toLowerCase().includes(q));
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.35)", justifyContent:"flex-end" }}>
        <TouchableOpacity style={{ flex:1 }} activeOpacity={1} onPress={onClose} />
        <View style={{ backgroundColor:"white", padding:16, borderTopLeftRadius:16, borderTopRightRadius:16, maxHeight:"65%" }}>
          <Text style={{ fontWeight:"700", fontSize:16, marginBottom:8 }}>Иконка сервиса</Text>
          <TextInput
            placeholder="Поиск (instagram, youtube, github…)"
            value={query} onChangeText={onQueryChange}
            style={[input,{ marginBottom:8 }]}
            autoCapitalize="none"
          />
          <FlatList
            data={filtered}
            keyExtractor={(i)=>`${i.set}:${i.name}`}
            numColumns={5}
            columnWrapperStyle={{ justifyContent:"space-between" }}
            renderItem={({ item })=>(
              <TouchableOpacity onPress={()=>onPick(item.name, item.set)} style={{ padding:12, borderWidth:1, borderColor:"#e5e7eb", borderRadius:12, marginBottom:10, width:"18%", alignItems:"center", justifyContent:"center" }}>
                {item.set==="fa5" ? <FontAwesome5 name={item.name as any} size={22} /> : <Ionicons name={item.name as any} size={22} />}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={onClose} style={{ alignItems:"center", padding:12 }}>
            <Text style={{ color:"#2563eb", fontWeight:"700" }}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
