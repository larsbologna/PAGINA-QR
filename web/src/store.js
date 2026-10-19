// Acceso a datos con Firebase (Firestore + Authentication).
// La seguridad la imponen las reglas de firestore.rules; este código solo hace
// las operaciones que esas reglas permiten a cada rol.
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  connectFirestoreEmulator,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const MESSAGES = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/wrong-password": "Email o contraseña incorrectos.",
  "auth/user-not-found": "Email o contraseña incorrectos.",
  "auth/invalid-email": "El email no es válido.",
  "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos y probá de nuevo.",
  "auth/network-request-failed": "Sin conexión. Revisá internet y probá de nuevo.",
  "auth/operation-not-allowed": "Este servicio todavía no está habilitado. Avisale al negocio.",
  "auth/admin-restricted-operation": "Este servicio todavía no está habilitado. Avisale al negocio.",
  unavailable: "Sin conexión. Revisá internet y probá de nuevo.",
  "deadline-exceeded": "La conexión está muy lenta. Probá de nuevo.",
  "permission-denied": "No tenés permiso para esta acción.",
};

export function friendlyError(e) {
  const err = new Error(MESSAGES[e?.code] ?? "Algo salió mal. Probá de nuevo.");
  err.code = e?.code;
  return err;
}

const toDate = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : new Date());

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "deadline-exceeded" })), ms))]);

export function createStore(config, emulators) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (emulators) {
    connectAuthEmulator(auth, `http://${emulators.auth}`, { disableWarnings: true });
    const [host, port] = emulators.firestore.split(":");
    connectFirestoreEmulator(db, host, Number(port));
  }

  let user = null;
  let ready = false;
  const listeners = new Set();
  onAuthStateChanged(auth, (u) => {
    user = u ? { uid: u.uid, email: u.email, anonymous: u.isAnonymous } : null;
    ready = true;
    listeners.forEach((fn) => fn(user));
  });
  const authReady = new Promise((res) => {
    const off = onAuthStateChanged(auth, () => {
      off();
      res();
    });
  });

  /** Sesión del visitante: anónima, sin datos personales. Si ya hay una sesión, se reutiliza. */
  async function visitorUid() {
    await authReady;
    if (auth.currentUser) return auth.currentUser.uid;
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  }

  const feedbackCol = (slug) => collection(db, "businesses", slug, "feedback");
  const parseFeedback = (d) => {
    const x = d.data();
    return {
      id: d.id,
      rating: x.rating,
      comment: x.comment ?? "",
      status: x.status === "resolved" ? "resolved" : "pending",
      note: x.note ?? "",
      createdAt: toDate(x.createdAt),
      resolvedAt: x.resolvedAt ? toDate(x.resolvedAt) : null,
      noteUpdatedAt: x.noteUpdatedAt ? toDate(x.noteUpdatedAt) : null,
    };
  };

  return {
    onAuth(fn) {
      listeners.add(fn);
      if (ready) fn(user);
      return () => listeners.delete(fn);
    },
    /** Dueño con sesión iniciada (no cuenta la sesión anónima de un visitante). */
    owner: () => (user && !user.anonymous ? user : null),
    async signIn(email, password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        throw friendlyError(e);
      }
    },
    signOut: () => signOut(auth),
    async resetPassword(email) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (e) {
        throw friendlyError(e);
      }
    },

    // ── Público ────────────────────────────────────────────────────────
    async getBusiness(slug) {
      try {
        const s = await withTimeout(getDoc(doc(db, "businesses", slug)), 15000);
        return s.exists() ? { slug, ...s.data() } : null;
      } catch (e) {
        throw friendlyError(e);
      }
    },
    /** Prepara la sesión anónima del visitante mientras elige la puntuación. */
    warmUp: () => visitorUid().catch(() => undefined),
    /**
     * Guarda una opinión. Es idempotente: con el mismo `id`, un reintento no la
     * duplica (si el primer intento llegó, se confirma en vez de volver a escribir).
     */
    async submitFeedback(slug, id, { rating, comment }) {
      let uid;
      try {
        uid = await withTimeout(visitorUid(), 15000);
      } catch (e) {
        throw friendlyError(e);
      }
      const ref = doc(db, "businesses", slug, "feedback", id);
      const batch = writeBatch(db);
      batch.set(ref, { rating, comment: rating === 5 ? "" : comment, uid, status: "pending", createdAt: serverTimestamp() });
      batch.set(doc(db, "throttle", uid), { at: serverTimestamp(), slug, fid: id });
      try {
        await withTimeout(batch.commit(), 15000);
      } catch (e) {
        // ¿Llegó en un intento anterior? Entonces no es un error.
        const arrived = await getDoc(ref).then((s) => s.exists(), () => false);
        if (arrived) return;
        if (e?.code === "permission-denied") {
          const err = new Error("Ya recibimos una opinión desde este dispositivo hace instantes. Esperá unos segundos y probá de nuevo.");
          err.code = "throttled";
          throw err;
        }
        throw friendlyError(e);
      }
    },

    // ── Panel del negocio ─────────────────────────────────────────────
    async myBusinesses() {
      const acc = await getDocs(query(collection(db, "access"), where("ownerUids", "array-contains", user.uid)));
      const list = await Promise.all(acc.docs.map((a) => this.getBusiness(a.id).catch(() => null)));
      return list.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, "es"));
    },
    async canManage(slug) {
      try {
        const s = await getDoc(doc(db, "access", slug));
        return s.exists() && (s.data().ownerUids ?? []).includes(user?.uid);
      } catch {
        return false;
      }
    },
    /** Opiniones en tiempo real (las nuevas aparecen sin recargar). */
    watchFeedback(slug, onData, onError) {
      return onSnapshot(
        query(feedbackCol(slug), orderBy("createdAt", "desc")),
        (s) => onData(s.docs.map(parseFeedback)),
        (e) => onError(friendlyError(e)),
      );
    },
    async setResolved(slug, id, resolved) {
      try {
        await updateDoc(doc(db, "businesses", slug, "feedback", id), {
          status: resolved ? "resolved" : "pending",
          resolvedAt: resolved ? serverTimestamp() : deleteField(),
        });
      } catch (e) {
        throw friendlyError(e);
      }
    },
    async setNote(slug, id, note) {
      try {
        await updateDoc(doc(db, "businesses", slug, "feedback", id), { note, noteUpdatedAt: serverTimestamp() });
      } catch (e) {
        throw friendlyError(e);
      }
    },
    async saveBusiness(slug, profile) {
      try {
        await updateDoc(doc(db, "businesses", slug), { ...profile, updatedAt: serverTimestamp() });
      } catch (e) {
        throw friendlyError(e);
      }
    },
  };
}
