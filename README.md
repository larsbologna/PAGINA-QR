# Pagina-QR

Opiniones de clientes desde un QR físico, con un panel privado para el negocio.

- **Pantalla pública** (`…/?c=<negocio>`): el cliente puntúa de 1 a 5 estrellas sin registrarse.
  - **5 estrellas:** se registra la puntuación, se agradece y se abre el enlace de Google Maps del negocio. Si el navegador no redirige, queda un botón visible.
  - **1 a 4 estrellas:** «¿Qué podríamos mejorar?», comentario opcional y envío. El botón de Google Maps sigue disponible siempre.
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
| `tools/crear-negocio.mjs` | Alta de negocios y dueños con el Admin SDK (no hay registro público ni panel de administración). |

Modelo: `businesses/{slug}` (perfil público), `businesses/{slug}/feedback/{id}` (opiniones), `access/{slug}` (dueños), `throttle/{uid}` (límite de envíos).

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

### 3. Dar de alta un negocio

Descargá la clave de servicio (**Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**). Guardala fuera del repositorio: da acceso total.

```bash
npm install
npm run negocio:crear -- --clave ~/claves/cuenta-servicio.json \
  --slug cafe-la-esquina --nombre "Café La Esquina" --email duena@ejemplo.com \
  --rubro Cafetería --google "https://g.page/r/…/review"
```

- Muestra una contraseña aleatoria **una sola vez**. Para elegirla, agregá `--password`.
- Si el email ya existe, vincula esa cuenta al negocio.
- Para pausar o reanudar la página pública: `--slug cafe-la-esquina --suspender` o `--activar`.
- El QR debe apuntar a `https://<tu-web>/?c=cafe-la-esquina`. Ese enlace no cambia aunque el dueño cambie el enlace de Google Maps.

## Desarrollo y pruebas

```bash
npm install
npm run serve        # arma web/dist y la sirve en http://localhost:4173
npm test             # reglas + recorridos en navegador contra los emuladores de Firebase (requiere Java 21)
npm run test:rules   # solo reglas de Firestore
```

Las pruebas cubren:

- Las puntuaciones de 1 a 5 y la redirección a Google.
- Doble toque sin duplicados, reintentos idempotentes y límite de envíos.
- Datos inválidos rechazados por el servidor.
- Nota y estado que persisten al recargar.
- Filtros, gráficos y tooltip.
- Cambio del enlace de Google reflejado en la pantalla pública.
- Aislamiento entre negocios y rutas privadas protegidas.
- Vista en celular sin scroll horizontal.

## Límites y costos

- Firestore gratuito: 50.000 lecturas y 20.000 escrituras por día. El panel lee todas las opiniones del negocio al abrirse, así que alcanza de sobra para negocios chicos y medianos.
- Contra el spam, las reglas limitan cada sesión a 1 opinión cada 30 s, y Firebase limita la creación de sesiones anónimas por IP. Para más protección, activá **App Check** (reCAPTCHA) en Firebase.
- Recuperar la contraseña usa el email de Firebase Authentication (gratis).
