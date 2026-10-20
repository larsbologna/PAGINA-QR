# ReseñaQR

Reseñas y opiniones de clientes desde un QR físico, con un panel privado para gestionar la reputación del negocio.

> ReseñaQR no es un producto de Google ni importa las reseñas públicas de Google. Recibe opiniones privadas por el QR y, con 5 estrellas, lleva al cliente al enlace de reseñas del negocio para que, si quiere, publique la suya.

- **Pantalla pública** (`…/?c=<negocio>`): el cliente puntúa de 1 a 5 estrellas sin registrarse.
  - **5 estrellas:** se agradece, se registra la puntuación y se abre el enlace de reseñas de Google del negocio tras una breve cuenta regresiva (durante la cual se puede cambiar la puntuación). Si el navegador no redirige, queda un botón visible.
  - **1 a 4 estrellas:** «¿Qué podríamos mejorar?», comentario opcional y envío. No se muestra ningún enlace ni botón a Google.
  - La opinión interna nunca se publica en Google; la pantalla lo aclara.
- **Panel privado** (`…/#/login`): resumen con datos reales (7 días, 30 días o todo), opiniones con filtros, nota interna con guardado automático, casilla «resuelta» y configuración del negocio.

Clasificación única en todo el sistema: **1–2 negativas · 3 intermedia · 4–5 positivas**. Las opiniones de 1 a 4 estrellas quedan **pendientes** hasta que el negocio las marque como resueltas.

El nombre y el logo están centralizados en `web/src/brand.js`; los colores, en `web/styles.css` (`:root`).

## Arquitectura

| Parte | Qué es |
|---|---|
| `web/` | Web estática (JavaScript sin framework, empaquetada con esbuild). Se publica gratis en GitHub Pages. |
| Firebase Authentication | Dueños con email y contraseña. Visitantes con sesión **anónima** (sin datos personales), usada solo para limitar envíos. |
| Firestore | Datos de negocios y opiniones. |
| `firestore.rules` | La seguridad real: validación de datos en el servidor, aislamiento entre negocios, límite de 1 opinión cada 30 s por visitante, notas privadas, puntuación inalterable. |
| `#/admin` | Panel de superadministrador: alta, limpieza, suspensión y eliminación de negocios. |
| `tools/crear-negocio.mjs` | Crea la cuenta de superadministrador (y también negocios) con el Admin SDK. |

Modelo: `admins/{uid}` (superadministradores), `businesses/{slug}` (perfil público), `businesses/{slug}/feedback/{id}` (opiniones), `access/{slug}` (dueños), `throttle/{uid}` (límite de envíos).

## Puesta en marcha

### 1. Firebase (plan gratuito Spark)

1. <https://console.firebase.google.com> → **Agregar proyecto**.
2. **Authentication → Método de acceso**: habilitá **Correo electrónico/contraseña** y **Anónimo**.
3. **Firestore Database → Crear base de datos** (modo producción, ubicación `southamerica-east1`).
4. Firestore → **Reglas**: pegá `firestore.rules` y **Publicar** (o `npx firebase deploy --only firestore:rules`).
5. **Configuración del proyecto → Tus apps → Web**: copiá `apiKey`, `authDomain`, `projectId` y `appId` en `web/firebase-config.js`. No son secretos.
6. **Authentication → Configuración → Dominios autorizados**: agregá el dominio donde se publique la web.

Sin el paso 5, la web muestra un aviso de configuración pendiente: no simula datos.

### 2. Publicar en GitHub Pages

**Settings → Pages → Source: GitHub Actions.** Cada cambio en `main` se publica solo (`.github/workflows/pages.yml`) en `https://<usuario>.github.io/<repo>/`.

### 3. Crear tu cuenta de superadministrador (una sola vez)

Descargá la clave de servicio (**Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**). Guardala fuera del repositorio: da acceso total.

```bash
npm install
npm run negocio:crear -- --clave C:\ruta\clave.json --superadmin --email vos@ejemplo.com --password "una-clave-larga"
```

Después volvé a publicar las reglas de `firestore.rules` en Firebase (incluyen los permisos del superadministrador).

### 4. Gestionar negocios desde la web

Entrá a `…/#/login` con tu cuenta: vas directo al panel **Superadmin** (`…/#/admin`), donde podés:

- **Nuevo negocio:** nombre, identificador del QR, rubro, enlace de Google y email del dueño. Crea su pantalla, su panel y la cuenta del dueño, y te muestra los datos para pasarle.
- **Abrir panel** de cualquier negocio (por ejemplo, para cargarle el logo).
- **Borrar opiniones:** deja el negocio limpio (por ejemplo, después de una demostración) y conserva el logo, el enlace y el dueño.
- **Suspender / Activar** la pantalla del QR (por ejemplo, si no paga).
- **Eliminar** el negocio con todas sus opiniones.
- **Enviar email de nueva contraseña** al dueño.

La herramienta de consola sigue disponible: `npm run negocio:crear -- --clave … --slug … --nombre … --email …` (y `--suspender` / `--activar`).

## Desarrollo y pruebas

```bash
npm install
npm run serve        # arma web/dist y la sirve en http://localhost:4173
npm test             # reglas + recorridos en navegador contra los emuladores de Firebase (requiere Java 21)
npm run test:rules   # solo reglas de Firestore
```

Las pruebas cubren:

- Las puntuaciones de 1 a 5: el acceso a Google existe solo con 5 estrellas y desaparece al cambiar de 5 a 4.
- Doble toque sin duplicados, reintentos idempotentes y límite de envíos.
- Datos inválidos rechazados por el servidor.
- Nota y estado que persisten al recargar.
- Filtros, gráficos y tooltip.
- Cambio del enlace de Google reflejado en la pantalla pública.
- Aislamiento entre negocios y rutas privadas protegidas.
- Vista en celular sin scroll horizontal.

## Límites y costos

- Firestore gratuito: 50.000 lecturas y 20.000 escrituras por día. El panel lee todas las opiniones del negocio al abrirse, así que alcanza de sobra para negocios chicos y medianos.
- Almacenamiento gratuito: 1 GB. Una opinión ocupa menos de 1 KB y un logo unos 30 a 100 KB: entran cientos de negocios y cientos de miles de opiniones. Si se supera, el plan Blaze cobra solo el excedente.
- Contra el spam, las reglas limitan cada sesión a 1 opinión cada 30 s, y Firebase limita la creación de sesiones anónimas por IP. Para más protección, activá **App Check** (reCAPTCHA) en Firebase.
- Recuperar la contraseña usa el email de Firebase Authentication (gratis).
