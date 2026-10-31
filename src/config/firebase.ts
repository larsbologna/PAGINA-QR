// Conexión con Firebase para las cuentas de clientes.
//
// Mientras apiKey esté vacío, la herramienta funciona sin cuentas: cada navegador guarda
// sus propios proyectos (modo local). Al completar estos datos, todos tienen que ingresar
// con usuario y contraseña y los proyectos se guardan en la nube, separados por cuenta.
//
// Cómo obtenerlos (ver README → "Cuentas de clientes"):
// Firebase → Configuración del proyecto → Tus apps → Web (</>) → copiar los valores.
// No son secretos: identifican el proyecto. La seguridad la dan las reglas de Firestore.
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** Solo para pruebas automáticas: usa los emuladores locales de Firebase. */
export const FIREBASE_EMULATORS = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "1";

export function accountsEnabled(): boolean {
  return FIREBASE_CONFIG.apiKey.trim().length > 0 && FIREBASE_CONFIG.projectId.trim().length > 0;
}
