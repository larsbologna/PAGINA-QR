# Reputación OS

Plataforma para gestionar la reputación online de comercios, restaurantes, gimnasios, barberías y otros negocios locales.

> **Qué es:** un QR físico lleva a una página rápida donde el cliente califica de 1 a 5 estrellas y deja un comentario privado. Las opiniones quedan en un panel privado del negocio con estadísticas y análisis. A **todos** los clientes, sin importar la puntuación, se les ofrece un enlace opcional para dejar una reseña pública en Google.
>
> **Qué no es:** no publica reseñas en Google, no filtra quién puede reseñar, no ofrece incentivos y no modifica ni garantiza el posicionamiento en Google.

El nombre "Reputación OS" se cambia con la variable `PRODUCT_NAME`.

---

## Versión web sin servidor (GitHub Pages + Firebase gratis)

Una sola página (`index.html`) publicada gratis en GitHub Pages. Se abre desde cualquier celular o computadora con un link: no hace falta CMD ni dejar una PC prendida. Los datos se guardan en Firebase (plan gratuito Spark).

Código en `web/`. Reglas de seguridad en `firestore.rules`.

Mientras `web/firebase-config.js` esté vacío, la página funciona en **modo demo**: los datos quedan guardados solo en ese navegador.

### 1. Publicar en GitHub Pages

1. Uní (merge) el pull request a la rama `main`.
2. En GitHub, andá a **Settings → Pages → Build and deployment → Source** y elegí **GitHub Actions**.
3. Cada cambio en `main` publica la página sola (workflow `.github/workflows/pages.yml`). El link queda así:
   `https://<tu-usuario>.github.io/<nombre-del-repo>/`
   - Página de un comercio: `…/?c=<slug>`. Es la dirección que va en el QR.
   - Panel: `…/#/login`.

### 2. Crear la base de datos en Firebase (gratis)

1. Entrá a <https://console.firebase.google.com> → **Agregar proyecto**. Google Analytics no hace falta.
2. **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Habilitar**.
3. **Compilación → Firestore Database → Crear base de datos**. Elegí la ubicación `southamerica-east1` y el **modo de producción**.
4. En Firestore, pestaña **Reglas**: borrá todo, pegá el contenido de `firestore.rules` y tocá **Publicar**.
5. En **Authentication → Users → Agregar usuario**, creá tu usuario de administrador. Después copiá su **UID**.
6. En **Firestore → Datos → Iniciar colección**:
   - ID de la colección: `admins`
   - ID del documento: el UID que copiaste
   - Un campo cualquiera, por ejemplo `nombre` = `admin`
7. En **Authentication → Configuración → Dominios autorizados**, agregá `<tu-usuario>.github.io`.
8. En **Configuración del proyecto (⚙) → General → Tus apps**, agregá una app **Web (</>)**. Copiá los valores `apiKey`, `authDomain`, `projectId` y `appId`.
9. En GitHub, editá `web/firebase-config.js` y pegá esos valores. Al guardar (commit en `main`), la página se vuelve a publicar sola.

Estos valores no son secretos: lo que protege los datos son las reglas de `firestore.rules`.

### 3. Usarla

- Entrá a `…/#/login` con tu usuario de administrador.
- Desde **Administración**, creá cada comercio y la cuenta de su dueño.
- Cada dueño entra con su email y solo ve su propio comercio.
- El QR se descarga desde el panel, en la pestaña **QR**.

### Límites del plan gratuito

- Firestore: 50.000 lecturas y 20.000 escrituras por día.
- Alcanza de sobra para varios comercios chicos.
- No hay limitación de frecuencia de envíos: el plan Spark no incluye Cloud Functions. Si en algún momento llega spam, se puede activar **App Check** en Firebase.

### Pruebas de la versión web

```bash
npm run test:web   # reglas de Firestore + recorridos en navegador (requiere Java 21)
```

---

## Inicio rápido en Windows (sin instalar nada más)

Solo necesitás **Node.js** (versión LTS, de <https://nodejs.org>).

1. Descargá el proyecto (botón verde **Code → Download ZIP** en GitHub) y descomprimilo.
2. Abrí la carpeta, escribí `cmd` en la barra de direcciones y apretá Enter. En esa ventana ejecutá:
   ```
   npm install
   ```
3. Hacé doble clic en **`iniciar.bat`**.

La primera vez tarda unos minutos: crea una base de datos local en la carpeta `.datos`, el usuario superadministrador y el negocio DEMO, y compila la web. Al terminar se abre el navegador. **Los usuarios y contraseñas quedan en `CREDENCIALES.txt`.**

- **Desde el celular:** la ventana muestra la dirección de tu computadora en la red (por ejemplo `http://192.168.0.15:3000`) y un QR para escanear. El celular tiene que estar en la **misma WiFi**. Si no abre, permití "Node.js" en redes privadas cuando Windows lo pregunte (Firewall). Los QR que descargues del panel también apuntan a esa dirección, así que sirven para probar en el local con celulares en la misma red. Para clientes reales, publicá la web con un dominio (ver Producción). Con `LOCAL_ONLY=1` se desactiva el acceso desde la red.
- Para cerrar: cerrá la ventana negra (o Ctrl+C). Para apagar también la base de datos: `detener.bat`.
- Las próximas veces, doble clic en `iniciar.bat` y listo (arranca en segundos).
- No hace falta Docker ni instalar PostgreSQL: viene incluido como paquete de npm (`embedded-postgres`). Funciona también en macOS y Linux con `node scripts/iniciar.mjs`.
- Esto es para usar o mostrar el sistema en tu computadora. Para que los clientes escaneen el QR desde su celular, hay que publicarlo en internet (ver [Producción y despliegue](#producción-y-despliegue)).

## Índice

1. [Funcionalidades](#funcionalidades)
2. [Arquitectura](#arquitectura)
3. [Requisitos](#requisitos)
4. [Instalación y desarrollo](#instalación-y-desarrollo)
5. [Variables de entorno](#variables-de-entorno)
6. [Base de datos y migraciones](#base-de-datos-y-migraciones)
7. [Primer superadministrador](#primer-superadministrador)
8. [Modo demostración](#modo-demostración)
9. [Pruebas](#pruebas)
10. [Producción y despliegue](#producción-y-despliegue)
11. [Costos potenciales](#costos-potenciales)
12. [Seguridad y privacidad](#seguridad-y-privacidad)
13. [Políticas de Google](#políticas-de-google)
14. [Limitaciones conocidas](#limitaciones-conocidas)

---

## Funcionalidades

**Página pública** (`/r/{slug}`, un QR propio por comercio), pensada primero para celulares
- Logo, nombre, mensaje de bienvenida y color de marca del negocio, con 5 estrellas grandes y accesibles.
- **5 estrellas:** botón "Continuar a Google Maps" con el enlace configurado por comercio. Se registran la puntuación y el clic. También permite "Prefiero dejar un comentario privado".
- **1 a 4 estrellas:** formulario privado con comentario, motivos (categorías) y **datos de contacto opcionales** (nombre, teléfono/WhatsApp, email). Los datos de contacto se guardan solo si la persona marca "Quiero que me contacten". El formulario muestra igualmente un enlace a Google Maps, y la pantalla final un botón para dejar reseña en Google.
- Protección contra doble envío, campo trampa contra bots y límite de envíos por conexión.

**Panel del negocio** (`/panel/{slug}`)
- **Resumen:** total de opiniones, promedio interno, últimos 7 y 30 días, distribución 1–5, positivas/neutrales/negativas (criterios configurables), categorías con más problemas, evolución en el tiempo y comparación con el período anterior. Todo se calcula con datos reales y se aclara que no es la calificación de Google.
- **Para mejorar:** opiniones de 1 a 4 estrellas con motivo, comentario, fecha, puntuación, contacto (con enlaces para llamar, WhatsApp o email) y **estado de seguimiento**: Nueva → En seguimiento → Resuelta.
- **Opiniones:** historial completo con filtros (puntuación, período, categoría, estado), búsqueda de texto, orden, paginación y notas internas. La puntuación y el comentario del cliente no se pueden editar.
- **Análisis:** conclusiones deterministas ("«Tiempo de espera» aparece en 12 opiniones…") que solo se muestran si hay datos suficientes.
- **Reportes:** reporte imprimible / PDF por período y exportación CSV (compatible con Excel en español).
- **Código QR:** vista previa, PNG en 4 tamaños, SVG vectorial, copia del enlace y plantilla de impresión A6.
- **Configuración:** nombre, logo, color, mensajes, enlace de Google con validación y vista previa en vivo de la experiencia del cliente, categorías y criterios.
- **Equipo:** invitaciones con enlace personal y roles (administrador o miembro).

**Panel maestro** (`/admin`, solo superadministrador)
- Alta de negocios con categorías según el rubro e invitación al dueño.
- Búsqueda, filtros por estado y plan, cantidad de opiniones por comercio.
- Ficha con diagnóstico de la cuenta, enlace para restablecer contraseñas, edición de datos, cambio de URL (las URLs viejas redirigen), plan con historial y vencimiento, suspensión/reactivación, equipo, retención de datos y eliminación.
- Registro de auditoría.

---

## Arquitectura

| Capa | Tecnología | Por qué |
|---|---|---|
| Aplicación | **Next.js 15** (App Router) + **React 19** + **TypeScript** | Un solo proyecto para la web pública, los paneles y la API. |
| Estilos | **Tailwind CSS 4** | Sistema visual consistente, sin dependencias de componentes pagas. |
| Base de datos | **PostgreSQL 16** + **Prisma 6** | Relacional, migraciones versionadas, Row Level Security. |
| Autenticación | Propia: contraseñas con **bcrypt**, sesiones en la base, cookie `httpOnly` | Sin proveedores externos ni costos por usuario. |
| Validación | **Zod** en cliente y servidor | Mismas reglas en ambos lados. |
| Gráficos | **Recharts** (series) y barras HTML accesibles | Librería mantenida; los valores también se muestran en tablas. |
| QR | **qrcode** (generación local) | Sin servicios externos que puedan cortar o cobrar. |
| Pruebas | **Vitest** (unitarias e integración con PostgreSQL real) + **Playwright** (E2E) | |

Organización del código:

```
prisma/                 esquema y migraciones (incluye CHECKs y RLS)
src/app/                rutas: página pública, paneles, API
src/components/         interfaz (ui, gráficos, formularios)
src/lib/                lógica pura compartida (validación, estadísticas, CSV, URLs de Google…)
src/server/             acceso a datos y reglas de negocio (solo servidor)
  auth/                 sesiones, credenciales, permisos
  services/             negocios, opiniones, estadísticas, QR, exportación, diagnóstico
  tenant.ts             transacciones aisladas por negocio (RLS)
scripts/                superadministrador, demo, retención, SQL auxiliar
tests/                  unit/, integration/, e2e/
```

### Aislamiento entre negocios (multi-tenant)

Se aplica en **tres capas**:

1. **Permisos en el servidor:** cada página, acción y endpoint verifica la sesión y la pertenencia al negocio (`resolveBusinessAccess`). Sin permiso se responde 404, sin revelar si el negocio existe.
2. **Consultas acotadas:** todos los servicios filtran por `businessId`.
3. **Base de datos:** las tablas `feedback`, `feedback_notes`, `feedback_categories` y `feedback_category_selections` tienen **Row Level Security** forzada. Cada operación corre en una transacción que fija `app.business_id`; PostgreSQL solo devuelve y acepta filas de ese negocio, aunque una consulta olvide el filtro. Además, claves foráneas compuestas `(id, businessId)` impiden que una nota o categoría apunte a otro negocio.

Las pruebas de integración verifican las tres capas (incluida una consulta sin `WHERE` que solo ve el negocio activo).

---

## Requisitos

- **Node.js 20 o superior** (probado con 22).
- **PostgreSQL 14 o superior** (probado con 16). Podés usar el `docker-compose.yml` incluido.
- npm.

---

## Instalación y desarrollo

```bash
# 1. Dependencias
npm install

# 2. Base de datos local (opción Docker; crea también las bases de prueba)
docker compose up -d

# 3. Variables de entorno
cp .env.example .env
#    Editá DATABASE_URL y APP_SECRET (generalo con: openssl rand -base64 32)

# 4. Migraciones
npx prisma migrate deploy

# 5. Primer superadministrador
npm run superadmin:create -- --email vos@tu-dominio.com

# 6. (Opcional) Negocio de demostración
DEMO_PASSWORD="una-clave-demo-larga" npm run demo:seed

# 7. Iniciar
npm run dev
```

Abrí <http://localhost:3000/login>.

Si no usás Docker, ejecutá el mismo script como superusuario:

```bash
psql -U postgres -f scripts/sql/init-local.sql
```

Crea el rol `reputacion` (**sin** `SUPERUSER` ni `BYPASSRLS`) y las bases `reputacion`, `reputacion_test` y `reputacion_e2e`. No conectes la app con el usuario `postgres`: un superusuario ignora el aislamiento entre negocios y las pruebas de aislamiento lo detectan y fallan a propósito.

---

## Variables de entorno

Ver `.env.example` (no contiene credenciales reales).

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión a PostgreSQL. **Usá un rol sin `SUPERUSER` ni `BYPASSRLS`.** |
| `APP_URL` | Sí | URL pública sin barra final (`https://tu-dominio.com`). Se usa en enlaces y QR. |
| `APP_SECRET` | Sí en producción | Secreto para los hashes de IP del limitador. Mínimo 16 caracteres. |
| `PRODUCT_NAME` | No | Nombre comercial. Por defecto "Reputación OS". |
| `PROVIDER_NAME`, `PROVIDER_CONTACT_EMAIL` | Recomendadas | Aparecen en Privacidad y Términos. |
| `TRUST_PROXY` | No | `true` si hay un proxy confiable que completa `X-Forwarded-For` (Vercel, Render, Nginx). |
| `RATE_LIMIT_FEEDBACK_PER_HOUR` | No | Opiniones por IP y negocio por hora (10). |
| `RATE_LIMIT_LOGIN_PER_15MIN` | No | Intentos de ingreso por IP+email (10). |
| `SESSION_DAYS` | No | Duración de la sesión (14). |

Las cookies de sesión llevan `Secure` automáticamente cuando `APP_URL` empieza con `https://`.

> `PRODUCT_NAME` también se usa en páginas estáticas (inicio, privacidad, términos): si lo cambiás, volvé a ejecutar `npm run build`.

---

## Base de datos y migraciones

- `npx prisma migrate deploy` — aplica las migraciones pendientes (desarrollo y producción).
- `npm run db:migrate` — crea una migración nueva al modificar `prisma/schema.prisma` (solo desarrollo).
- `npm run db:studio` — explorador visual (ojo: Prisma Studio no fija el contexto de RLS, así que no muestra las opiniones).

Migraciones incluidas:

1. `init`: tablas, índices, claves únicas y foráneas con sus políticas de borrado.
2. `checks_and_rls`: restricciones `CHECK` (puntuación 1–5, longitudes, formato de slug y color, umbrales) y políticas de Row Level Security.
3. `password_resets`: enlaces de restablecimiento de contraseña.

Políticas de borrado: al eliminar un negocio se eliminan en cascada sus opiniones, notas, categorías, miembros, planes e invitaciones; los registros de auditoría se conservan sin el vínculo. Las categorías no se borran, se **archivan**, para conservar el historial.

Modelo principal: `users`, `sessions`, `password_resets`, `businesses`, `business_members`, `invitations`, `business_plans`, `business_slug_history`, `feedback_categories`, `feedback`, `feedback_category_selections`, `feedback_notes`, `audit_logs`, `rate_limit_buckets`. No se guardan datos personales de los clientes finales.

---

## Primer superadministrador

No hay registro público: el acceso es por invitación. El primer superadministrador se crea por consola:

```bash
npm run superadmin:create -- --email vos@tu-dominio.com
# Muestra una contraseña aleatoria UNA vez. Para elegirla:
npm run superadmin:create -- --email vos@tu-dominio.com --password "una-clave-larga"
```

Si el email ya existe, lo promueve a superadministrador. Después:

1. Ingresá en `/login` → panel maestro.
2. **Nuevo negocio**: nombre, rubro, plan, enlace de Google y email del dueño.
3. Copiá el **enlace de invitación** y enviáselo al dueño (WhatsApp, email). Vence en 7 días y sirve una sola vez. Con él, el dueño elige su contraseña.
4. Descargá el QR desde la ficha o desde el panel del negocio.

---

## Modo demostración

```bash
DEMO_PASSWORD="una-clave-demo-larga" npm run demo:seed
```

Crea "Café La Esquina" (`/r/demo-cafe-la-esquina`) con logo, categorías y unas 185 opiniones ficticias de los últimos 4 meses, con tendencias coherentes. Ingresá con `demo@reputacion-os.local` y la contraseña elegida (si no la definís, se genera y se muestra una vez).

- El negocio queda marcado `isDemo`: lleva una franja **DEMO** en la página pública, el panel, los reportes y el CSV.
- Las opiniones viven solo dentro de ese negocio: nunca se mezclan con negocios reales, y cada negocio nuevo empieza vacío.
- Volver a ejecutar el comando recrea la demo; nunca toca un negocio real (si existe uno real con ese slug, se niega).
- En producción se niega a correr salvo `ALLOW_DEMO_SEED=true`. Para mostrar el producto, lo recomendable es una instancia separada de demo.

---

## Pruebas

```bash
npm run typecheck          # TypeScript
npm run lint               # ESLint
npm test                   # unitarias + integración (PostgreSQL real, base reputacion_test)
npm run test:e2e           # Playwright: construye la app y la prueba en el navegador (base reputacion_e2e)
```

- Las pruebas de integración usan `TEST_DATABASE_URL` (por defecto `…/reputacion_test`) y **se niegan a vaciar** una base cuyo nombre no termine en `_test`.
- Las E2E usan `E2E_DATABASE_URL` (por defecto `…/reputacion_e2e`), levantan la app en el puerto 3100 y se niegan a vaciar una base que no termine en `_e2e`. Con `E2E_SKIP_BUILD=1` reutilizan el último build.
- Si Playwright no encuentra el navegador: `npx playwright install chromium`.

Qué cubren (resumen):

| Área | Pruebas |
|---|---|
| Acceso | inicio de sesión, invitación y restablecimiento de contraseña de un solo uso, fuerza bruta, redirección segura, rutas privadas sin sesión, dueño sin acceso al panel maestro |
| Negocios | alta, slug único, URL vieja que redirige, plan con historial, suspensión y reactivación |
| QR | PNG en 4 tamaños decodificado con `jsQR` → coincide con la URL pública; SVG; plantilla con nombre escapado |
| Opiniones | 1 a 5 estrellas, rechazo de puntuaciones inválidas (servidor y `CHECK` en la base), doble clic y envíos concurrentes sin duplicar, categorías ajenas o archivadas, campo trampa, límite por IP, negocio suspendido |
| Google | el botón aparece con todas las puntuaciones, y también antes de puntuar |
| Estadísticas | indicadores comparados contra los datos insertados, umbrales, período anterior, "datos insuficientes" |
| Bandeja | filtros, búsqueda literal (`%` y `_` no son comodines), orden, paginación, notas, revisión sin alterar la puntuación |
| CSV | filtros, sin notas internas, neutralización de fórmulas |
| Aislamiento | servicios, permisos, RLS (consulta sin filtro, inserción cruzada, sin contexto) y rol sin `BYPASSRLS` |
| Interfaz | recorrido completo, uso en celular (tamaño de toque, sin scroll horizontal, teclado), estados de error, vacío y 404, sin errores de consola |

En CI (`.github/workflows/ci.yml`) se ejecuta todo lo anterior con un PostgreSQL de servicio.

---

## Producción y despliegue

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start            # puerto 3000 (o: npx next start -p $PORT)
```

Lista de verificación:

1. **HTTPS** y dominio propio en `APP_URL` **antes de imprimir QR** (el QR apunta a `APP_URL/r/{slug}`, que no cambia aunque cambie el diseño).
2. `APP_SECRET` largo y aleatorio. `TRUST_PROXY=true` solo detrás de un proxy confiable.
3. **Rol de base de datos para la app sin `SUPERUSER` ni `BYPASSRLS`** (ver `scripts/sql/create-app-role.sql`). Corré las migraciones con el rol dueño y la app con el rol restringido.
4. Programá la retención una vez por día: `npm run retention:run` (cron, tarea programada del proveedor).
5. Backups automáticos de PostgreSQL.
6. Revisá los textos de `src/content/legal.ts` (privacidad y términos) con un profesional.

### Opciones de hosting

- **VPS (por ejemplo, un servidor Linux con Docker o Node + PostgreSQL)**: costo fijo y bajo, control total. Requiere mantener el servidor, HTTPS (Caddy/Nginx + Let's Encrypt) y backups.
- **Vercel / Netlify + PostgreSQL administrado (Supabase, Neon)**: menos mantenimiento. Con funciones serverless, usá la cadena de conexión del *pooler* del proveedor. Las sesiones de RLS usan `set_config(..., true)` dentro de transacciones, compatible con poolers en modo transacción.
- **Render / Railway / Fly.io**: aplicación Node + PostgreSQL en el mismo proveedor.

Supabase se puede usar **solo como PostgreSQL** (esta app no usa Supabase Auth). En ese caso, creá el rol restringido del punto 3: los roles por defecto de Supabase pueden tener privilegios que ignoran RLS.

---

## Costos potenciales

El código no depende de servicios pagos: no usa APIs de Google (solo un enlace público), ni servicios externos de QR, email o almacenamiento (los logos se guardan en la base, máx. 512 KB). Los costos son de infraestructura:

| Componente | Opción de bajo costo | A tener en cuenta |
|---|---|---|
| Hosting de la app | Planes gratuitos o un VPS chico | **Vercel Hobby no permite uso comercial**: para un servicio pago corresponde un plan Pro. Los planes gratuitos de Render y similares "duermen" la app tras inactividad (primera carga lenta). |
| PostgreSQL | Planes gratuitos de Supabase o Neon | Límites de almacenamiento y cómputo. En Supabase gratuito, los proyectos se pausan tras un período sin actividad. Los planes gratuitos suelen no incluir backups con retención suficiente. |
| Dominio | Registro anual | `.com.ar` en NIC Argentina o `.com` en un registrador. |
| HTTPS | Let's Encrypt (gratis) | Incluido en la mayoría de los proveedores. |

**Ningún plan gratuito es para siempre:** precios, límites y condiciones cambian. Verificá las páginas oficiales de cada proveedor antes de comprometer precios con tus clientes. Como referencia de tamaño: 1000 opiniones ocupan del orden de cientos de KB; una base gratuita alcanza para muchos negocios pequeños.

---

## Seguridad y privacidad

- **Contraseñas:** bcrypt (costo 12). Mínimo 10 caracteres. Mensaje de error idéntico exista o no el usuario.
- **Sesiones:** token aleatorio de 256 bits; en la base solo se guarda su SHA-256. Cookie `httpOnly`, `SameSite=Lax`, `Secure` con HTTPS. Al cambiar la contraseña se cierran las demás sesiones. El cierre de sesión hace una recarga completa (no quedan datos privados en la caché del navegador).
- **CSRF:** las Server Actions de Next verifican el origen; los endpoints `POST` propios (`/api/auth/*`, `/api/public/feedback`) rechazan orígenes externos.
- **XSS:** React escapa todo el contenido; el SVG del QR y la plantilla se generan en el servidor escapando el nombre del negocio; los logos se validan por contenido real (PNG/JPG/WEBP, no SVG) y se sirven con `Content-Security-Policy: default-src 'none'`.
- **Inyección SQL:** Prisma con consultas parametrizadas; las consultas SQL propias usan plantillas parametrizadas.
- **Cabeceras:** CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HSTS en producción.
- **Abuso:** límites de frecuencia persistidos en PostgreSQL (sirven con varias instancias) para opiniones, ingresos, invitaciones y cambio de contraseña; las IP se guardan solo como hash con secreto y se descartan a las 24 h. Campo trampa contra bots.
- **Datos personales:** las opiniones son anónimas; no se guarda la IP. El CSV y los reportes no incluyen notas internas.
- **Registros técnicos:** JSON estructurado sin comentarios, notas, contraseñas ni tokens.
- **Auditoría:** acciones administrativas registradas (sin contenido de opiniones).
- **Retención:** cada negocio define cuántos meses conservar opiniones (por defecto 24); `npm run retention:run` elimina las más antiguas. El superadministrador puede aplicarla o eliminar un negocio completo.
- **Errores:** páginas de error genéricas; los detalles quedan solo en los registros del servidor.

---

## Políticas de Google

El producto está diseñado para cumplir las políticas de Google sobre contenido de reseñas (contenido falso y prácticas como el "review gating"):

- El botón para reseñar en Google se muestra a **todas** las personas, con cualquier puntuación, y también antes de puntuar.
- No hay incentivos, sorteos ni descuentos ligados a reseñas, y la interfaz desaconseja ofrecerlos.
- La opinión privada **nunca** se publica automáticamente: si la persona quiere una reseña pública, la escribe y la envía ella misma en Google.
- No hay mecanismos para cambiar puntuaciones ni para pedir que se cambien. La puntuación interna no se presenta como calificación de Google.

---

## Limitaciones conocidas

- **No hay envío de emails:** las invitaciones y los enlaces para restablecer contraseña se comparten copiando el enlace. Si alguien olvida su contraseña, el superadministrador genera desde la ficha del negocio (Equipo → "Restablecer contraseña") un enlace de un solo uso que vence en 24 h. Un "olvidé mi contraseña" autoservicio requiere integrar un proveedor de email. Para el propio superadministrador: `npm run superadmin:create -- --email … --password …`.
- **Planes sin diferencias funcionales:** Básico/Profesional/Premium se registran (con historial y vencimiento) para la gestión comercial, pero todavía no habilitan o limitan funciones. El vencimiento es informativo: no suspende la cuenta automáticamente.
- **Sin módulo de IA:** el análisis es determinista. Se puede sumar un resumen con IA como módulo opcional, sin que el sistema dependa de él.
- **Reporte en PDF** mediante "Imprimir → Guardar como PDF" del navegador (sin generador de PDF en el servidor).
- **Zona horaria** fija por negocio en America/Argentina/Buenos_Aires (el campo existe en la base, sin pantalla para cambiarlo).
- **Prisma Studio** no muestra opiniones por la RLS (comportamiento esperado).
- **Next.js:** en esta versión, los archivos `loading.tsx` a nivel de layout hacían que las actualizaciones posteriores a una acción quedaran incompletas; se quitaron y el progreso de navegación se indica en el menú.
- Las páginas de error y el selector de archivos usan los textos nativos del navegador según su idioma.
