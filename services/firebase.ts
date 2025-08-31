import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection } from "firebase/firestore";
import type { Project } from "../contexts/ProjectsContext";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_ID.firebaseapp.com",
  projectId: "YOUR_ID",
  storageBucket: "YOUR_ID.appspot.com",
  messagingSenderId: "XXXX",
  appId: "1:XXXX:web:YYYY",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Сохраняем/обновляем проект
export async function cloudSaveProject(ownerEmail: string, project: Project) {
  const ref = doc(db, "users", ownerEmail, "projects", project.id);
  await setDoc(ref, project, { merge: true });
}

// Загружаем все проекты владельца
export async function cloudLoadProjects(ownerEmail: string): Promise<Project[]> {
  const col = collection(db, "users", ownerEmail, "projects");
  const snap = await getDocs(col);
  const res: Project[] = [];
  snap.forEach((d) => res.push(d.data() as Project));
  return res;
}
