// Almacenamiento con Firebase (Firestore + Authentication).
// La seguridad la imponen las reglas de firestore.rules; este código solo hace
// las operaciones que esas reglas permiten a cada rol.
import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const AUTH_ERRORS = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/wrong-password": "Email o contraseña incorrectos.",
  "auth/user-not-found": "Email o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos.",
  "auth/email-already-in-use": "Ese email ya tiene una cuenta.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email": "El email no es válido.",
  "auth/network-request-failed": "Sin conexión. Revisá internet y probá de nuevo.",
};

function friendly(e) {
  return new Error(AUTH_ERRORS[e?.code] ?? (e?.code === "permission-denied" ? "No tenés permiso para esta acción." : e?.message ?? "Error inesperado."));
}

const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : new Date(0));

export function createFirebaseStore(config, emulators) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (emulators) {
    connectAuthEmulator(auth, `http://${emulators.auth}`, { disableWarnings: true });
    const [host, port] = emulators.firestore.split(":");
    connectFirestoreEmulator(db, host, Number(port));
  }
  let user = null;
  let adminCache = null;
  const listeners = new Set();
  let ready = false;
  onAuthStateChanged(auth, (u) => {
    user = u ? { uid: u.uid, email: u.email } : null;
    adminCache = null;
    ready = true;
    listeners.forEach((fn) => fn(user));
  });

  return {
    mode: "firebase",
    onAuth(fn) {
      listeners.add(fn);
      if (ready) fn(user);
      return () => listeners.delete(fn);
    },
    currentUser: () => user,
    async signIn(email, password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        throw friendly(e);
      }
    },
    async signOut() {
      await signOut(auth);
    },
    async resetPassword(email) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (e) {
        throw friendly(e);
      }
    },
    async isAdmin() {
      if (!user) return false;
      if (adminCache === null) adminCache = (await getDoc(doc(db, "admins", user.uid))).exists();
      return adminCache;
    },
    async getBusiness(slug) {
      const s = await getDoc(doc(db, "businesses", slug));
      return s.exists() ? s.data() : null;
    },
    async submitFeedback(slug, input) {
      try {
        await addDoc(collection(db, "businesses", slug, "feedback"), { ...input, status: "NEW", createdAt: serverTimestamp() });
      } catch (e) {
        throw friendly(e);
      }
    },
    async recordGoogleClick(slug) {
      const ref = doc(db, "businesses", slug, "clicks", new Date().toISOString().slice(0, 10));
      try {
        await updateDoc(ref, { count: increment(1) });
      } catch {
        await setDoc(ref, { count: 1 }).catch(() => undefined);
      }
    },
    async myBusinesses() {
      if (await this.isAdmin()) return this.listBusinesses();
      const acc = await getDocs(query(collection(db, "access"), where("ownerUids", "array-contains", user.uid)));
      const list = await Promise.all(acc.docs.map(async (a) => ({ slug: a.id, ...(await this.getBusiness(a.id)) })));
      return list.filter((b) => b.name);
    },
    async listBusinesses() {
      const s = await getDocs(collection(db, "businesses"));
      return s.docs.map((d) => ({ slug: d.id, ...d.data() }));
    },
    async listFeedback(slug) {
      const s = await getDocs(query(collection(db, "businesses", slug, "feedback"), orderBy("createdAt", "desc"), limit(3000)));
      return s.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) }));
    },
    async setStatus(slug, id, status) {
      try {
        await updateDoc(doc(db, "businesses", slug, "feedback", id), { status, statusUpdatedAt: serverTimestamp() });
      } catch (e) {
        throw friendly(e);
      }
    },
    async setNote(slug, id, note) {
      try {
        await updateDoc(doc(db, "businesses", slug, "feedback", id), { note });
      } catch (e) {
        throw friendly(e);
      }
    },
    async getClicks(slug) {
      const s = await getDocs(collection(db, "businesses", slug, "clicks"));
      return s.docs.map((d) => ({ day: d.id, count: d.data().count ?? 0 }));
    },
    async saveBusiness(slug, profile, { isNew = false } = {}) {
      try {
        if (isNew) {
          if ((await getDoc(doc(db, "businesses", slug))).exists()) throw new Error("Ya existe un comercio con ese identificador.");
          await setDoc(doc(db, "businesses", slug), { ...profile, isDemo: false, createdAt: serverTimestamp() });
          await setDoc(doc(db, "access", slug), { ownerUids: [], ownerEmails: [] });
        } else {
          await updateDoc(doc(db, "businesses", slug), { ...profile, updatedAt: serverTimestamp() });
        }
      } catch (e) {
        throw e instanceof Error && !e.code ? e : friendly(e);
      }
    },
    async getAccess(slug) {
      const s = await getDoc(doc(db, "access", slug));
      return s.exists() ? s.data() : { ownerUids: [], ownerEmails: [] };
    },
    /**
     * Crea la cuenta del dueño sin cerrar la sesión del administrador (usa una
     * instancia secundaria de Firebase) y le da acceso al comercio.
     */
    async createOwner(slug, email, password) {
      const secondary = initializeApp(config, `alta-${Date.now()}`);
      try {
        const secAuth = getAuth(secondary);
        if (emulators) connectAuthEmulator(secAuth, `http://${emulators.auth}`, { disableWarnings: true });
        const cred = await createUserWithEmailAndPassword(secAuth, email, password);
        await setDoc(doc(db, "access", slug), { ownerUids: arrayUnion(cred.user.uid), ownerEmails: arrayUnion(email.toLowerCase()) }, { merge: true });
      } catch (e) {
        throw friendly(e);
      } finally {
        await deleteApp(secondary).catch(() => undefined);
      }
    },
  };
}
