"use client";
import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { FIREBASE_CONFIG, FIREBASE_EMULATORS } from "@/config/firebase";
import { firebaseAuth, firestore } from "./app";

// Cuentas de clientes. Solo el administrador crea cuentas y las habilita; cada cliente
// ingresa con su email y contraseña y ve únicamente sus propios proyectos.

export interface Account {
  uid: string;
  email: string;
  name: string;
  active: boolean;
  note: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface Session {
  user: User;
  account: Account | null;
  isAdmin: boolean;
}

function toAccount(uid: string, d: Record<string, unknown>): Account {
  return {
    uid,
    email: String(d.email ?? ""),
    name: String(d.name ?? ""),
    active: d.active === true,
    note: String(d.note ?? ""),
    createdAt: Number(d.createdAt ?? 0),
    updatedAt: Number(d.updatedAt ?? 0),
    createdBy: String(d.createdBy ?? ""),
  };
}

export function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email o contraseña incorrectos.";
  if (code.includes("too-many-requests")) return "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
  if (code.includes("invalid-email")) return "El email no es válido.";
  if (code.includes("email-already-in-use")) return "Ya existe una cuenta con ese email.";
  if (code.includes("weak-password")) return "La contraseña tiene que tener al menos 6 caracteres.";
  if (code.includes("network")) return "No hay conexión. Revisá internet y probá de nuevo.";
  if (code.includes("permission-denied")) return "No tenés permiso para hacer esto.";
  if (code.includes("operation-not-allowed")) return "El ingreso con email y contraseña no está habilitado en Firebase.";
  return "Algo salió mal. Probá de nuevo.";
}

export async function loadSession(user: User): Promise<Session> {
  const db = firestore();
  const [acc, admin] = await Promise.all([getDoc(doc(db, "cs_accounts", user.uid)), getDoc(doc(db, "cs_admins", user.uid))]);
  return { user, account: acc.exists() ? toAccount(user.uid, acc.data()) : null, isAdmin: admin.exists() };
}

export function watchUser(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth(), cb);
}

export async function login(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
}

export async function logout(): Promise<void> {
  await signOut(firebaseAuth());
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(firebaseAuth(), email.trim());
}

// ——— Administración ———

export async function listAccounts(): Promise<Account[]> {
  const snap = await getDocs(query(collection(firestore(), "cs_accounts"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => toAccount(d.id, d.data()));
}

/**
 * Crea un cliente: usuario de acceso + cuenta habilitada. El usuario se crea en una
 * instancia aparte de Firebase para que el administrador no pierda su sesión.
 */
export async function createAccount(input: { email: string; password: string; name: string; note: string }, adminUid: string): Promise<Account> {
  const secondary = initializeApp(FIREBASE_CONFIG, `alta-${Date.now()}`);
  try {
    const auth = getAuth(secondary);
    if (FIREBASE_EMULATORS) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    await signOut(auth);
    const now = Date.now();
    const data = { email: input.email.trim(), name: input.name.trim(), active: true, note: input.note.trim(), createdAt: now, updatedAt: now, createdBy: adminUid };
    await setDoc(doc(firestore(), "cs_accounts", cred.user.uid), data);
    return toAccount(cred.user.uid, data);
  } finally {
    await deleteApp(secondary);
  }
}

/** Habilita como cliente a un usuario que ya existe (por ejemplo, el propio administrador). */
export async function enableExistingUser(user: User, name: string): Promise<void> {
  const now = Date.now();
  await setDoc(doc(firestore(), "cs_accounts", user.uid), {
    email: user.email ?? "",
    name,
    active: true,
    note: "Administrador",
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
  });
}

export async function updateAccount(uid: string, patch: Partial<Pick<Account, "name" | "note" | "active">>): Promise<void> {
  await updateDoc(doc(firestore(), "cs_accounts", uid), { ...patch, updatedAt: Date.now() });
}
