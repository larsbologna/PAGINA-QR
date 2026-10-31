# Carrusel Studio

Generador de carruseles para Instagram: brief → propuesta de estructura → revisión → diseño slide por slide → exportación PNG/ZIP.

Herramienta: **`/carousel-google-maps`** (la raíz `/` redirige ahí).

```bash
npm install
npm run dev        # http://localhost:3000/carousel-google-maps
npm test           # pruebas unitarias
npm run typecheck  # verificación de tipos
npm run build      # compilación de producción (la misma que usa Vercel)
npm run test:rules # reglas de seguridad de las cuentas (emulador de Firestore; requiere Java)
```

La marca (nombre, frase y contacto que ven tus clientes) se cambia en `src/config/brand.ts`.

**Link publicado:** https://larsbologna.github.io/PAGINA-QR/carousel-google-maps/

Se publica solo en GitHub Pages con cada cambio en `main` (`.github/workflows/pages.yml`): compila una versión estática con `GITHUB_PAGES=1` y la sirve en `/PAGINA-QR/carousel-google-maps/`. La raíz `/PAGINA-QR/` sigue siendo la redirección de los QR impresos de ReseñaQR. En GitHub Pages no existe el guardado en `public/export` (las imágenes se descargan con el navegador).

También se puede desplegar en Vercel sin configuración extra.

## Cómo se usa

0. **Tipo de carrusel** (obligatorio antes de proponer): Negocios, Crecimiento personal, Motivación, Mi proceso o Hábitos y productividad. Cambia los nombres de los campos, el papel de cada slide, los textos base, los visuales sugeridos y el diseño por defecto (Negocios: oscuro y contundente; Crecimiento: editorial claro con serif; Motivación: frases grandes sobre aura violeta; Mi proceso: cálido y sobrio para fotos propias; Hábitos: claro y ordenado en azul). El diseño del tipo se aplica solo si no personalizaste el actual; si no, aparece "Usar el diseño de…" en la sección Diseño. En "Mi proceso" quedan textos `[entre corchetes]` para completar con tu historia; la exportación avisa si queda alguno.
1. **Brief** (panel izquierdo): temática, negocio, objetivo, público, problema, beneficio, servicio, llamada a la acción, tono e instrucciones. Las líneas de las instrucciones que empiezan con `-` o un número se usan como consejos propios.
2. **Proponer estructura**: arma de 1 a 10 slides con estructura narrativa (gancho, problema, ejemplo, cómo funciona, argumento, consejos, CTA).
3. **Revisión**: se edita cada título, subtítulo, texto y visual. Nada pasa al diseño hasta tocar **Aprobar**.
4. **Diseño**: lienzo con vista individual o de todos, zoom, área segura y márgenes; tira de miniaturas (arrastrar para reordenar); panel derecho para editar el slide seleccionado (textos, visual, imagen, alineación, colores, tamaños, duplicar, mover, eliminar).
5. **EXPORTAR A PNG**: un ZIP o PNG individuales numerados, con la medida exacta (1080×1440 o 1080×1350).

Atajos: `Ctrl/Cmd+Z` deshacer, `Ctrl/Cmd+Shift+Z` rehacer, `Ctrl/Cmd+S` guardar, flechas para cambiar de slide.
En los textos, `*palabra*` se resalta con el color de acento.

## Proyectos

Se guardan solos: en el navegador (sin cuentas) o en la nube de cada cliente (con cuentas). Con cuentas, si en ese navegador había proyectos guardados de antes, **Proyectos** ofrece pasarlos a la cuenta. Desde **Proyectos**: nuevo, abrir, duplicar, renombrar, eliminar, descargar copia `.json` e importar. Al volver se abre el último proyecto. En **Diseño → Mis diseños** se guardan combinaciones de colores, tipografías y tamaños para reutilizar.

La primera vez se precarga el ejemplo **"Cómo las reseñas de Google Maps llenan tu local"** (10 slides, negocios). Plantillas disponibles: ese ejemplo y **"Lo que nadie te dice sobre la constancia"** (7 slides, crecimiento personal).

## Visuales

Más de 40 visuales en una galería con vista previa (botón «Cambiar visual» en el panel del slide): datos y gráficos, diagramas, listas y comparaciones, interfaces y mockups, imágenes, Google Maps y personalizados. Además:

- **Bloques con íconos:** armás tu propio visual con hasta 8 tarjetas (ícono, título y texto), en grilla, fila, columna o destacado, con flechas o numeración.
- **Más de 8000 íconos** (Lucide y Tabler) con búsqueda en español, y emojis.
- **Dibujo propio:** pegá o subí un SVG hecho en cualquier programa, o pedíselo a la IA describiéndolo.

Todo SVG que no escribimos nosotros (IA, importado o dentro de un `.json`) se sanea antes de dibujarse.

## IA opcional (cada usuario con su clave)

Sin IA todo funciona gratis. Con una clave de Anthropic (console.anthropic.com → API Keys), desde el botón **IA**:

- **Propuesta con IA:** escribe el carrusel completo según el tipo, el brief y el tono, eligiendo visuales y completándolos.
- **Dibujos a pedido:** en el visual «Dibujo propio», describí lo que querés y lo dibuja con los colores del slide.

La clave se guarda solo en ese navegador y se envía únicamente a Anthropic; el uso se cobra en la cuenta de quien la carga. Modelo por defecto: Claude Opus 5.5 (se puede elegir Sonnet 5.5 o Haiku 5.5, más económicos).

## Cuentas de clientes

Sin configurar nada, la herramienta funciona sin cuentas y cada navegador guarda sus proyectos. Para venderla con una cuenta por cliente (proyectos en la nube, separados por cuenta):

1. **Firebase (gratis):** en https://console.firebase.google.com creá un proyecto nuevo.
2. **Authentication → Método de acceso:** habilitá **Correo electrónico/contraseña**.
3. **Firestore Database → Crear base de datos** (modo producción). En la pestaña **Reglas**, pegá el contenido de `firestore.rules` y tocá **Publicar**.
4. **Configuración del proyecto → Tus apps → Web (</>)**: registrá una app y copiá `apiKey`, `authDomain`, `projectId` y `appId`.
5. **GitHub → Settings → Secrets and variables → Actions → Variables:** creá `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` y `NEXT_PUBLIC_FIREBASE_APP_ID` con esos valores. Volvé a publicar (Actions → GitHub Pages → Run workflow). En local, copiá `.env.example` como `.env.local`.
6. **Authentication → Configuración → Dominios autorizados:** agregá el dominio donde está publicada (por ejemplo `larsbologna.github.io`).
7. **Tu usuario de administrador:** en Authentication → Users → **Agregar usuario** (tu email y contraseña). Copiá su **UID**, andá a Firestore → **Iniciar colección** `cs_admins` → ID del documento = ese UID → un campo `createdAt` (number) con `1`.
8. Entrá a la herramienta con ese usuario y tocá **Habilitar mi cuenta de administrador**.

Desde el menú de tu cuenta (círculo arriba a la derecha) → **Administrar clientes**: das de alta a cada cliente (nombre, email, contraseña inicial y una nota, por ejemplo «Pago único 31/10»), copiás el mensaje con sus datos de acceso para mandárselo, y podés pausar, reactivar o enviar un correo para cambiar la contraseña. Un cliente pausado no puede entrar. Ni vos ni otros clientes ven sus proyectos.

Las reglas de `firestore.rules` son las que garantizan todo esto en el servidor (están probadas en `tests/rules.test.ts`).

**Hosting para vender:** GitHub Pages no admite uso comercial. Para vender, publicá la misma web en Vercel, Netlify o Firebase Hosting (todos con plan gratuito que lo permite) y agregá ese dominio en el paso 6.

## Exportación

- Captura con `html-to-image` el mismo componente que se ve en el editor, con las fuentes incrustadas.
- `public/export/<proyecto>/`: solo en local (`npm run dev`, o `ENABLE_LOCAL_EXPORT=1` con `npm start`). En Vercel queda desactivado porque el disco no es persistente; ahí se usan las descargas del navegador.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/app/carousel-google-maps/` | Página de la herramienta. |
| `src/app/api/export/` | Guardado local en `public/export` (desactivado en producción). |
| `src/lib/types.ts` | Modelo de datos: proyecto, brief, diseño, slides. |
| `src/lib/formats.ts` | Formatos y márgenes de seguridad (50 px laterales, 180 px arriba y abajo). |
| `src/lib/content/` | Estructura narrativa y generación de contenido. |
| `src/lib/projectOps.ts`, `src/lib/store.ts` | Operaciones sobre el proyecto e historial. |
| `src/lib/storage/` | Persistencia: navegador (localStorage) o nube (Firestore, por cuenta). |
| `src/lib/firebase/`, `src/components/auth/` | Cuentas: ingreso, sesión, panel de clientes. |
| `src/lib/ai/` | IA opcional con la clave del usuario. |
| `src/lib/icons.ts`, `src/lib/sanitize.ts` | Biblioteca de íconos y saneamiento de SVG. |
| `src/config/` | Marca y conexión con Firebase. |
| `firestore.rules`, `tests/rules.test.ts` | Reglas de seguridad y sus pruebas. |
| `src/lib/export/` | Captura PNG, ZIP y descargas. |
| `src/components/slide/` | `<Slide number={...} />` a tamaño real, decoraciones y ajuste automático del texto. |
| `src/components/visuals/` | Visuales en SVG/CSS: generales, biblioteca ampliada y Google Maps. |
| `src/components/editor/` | Interfaz del editor. |
| `src/data/templates/` | Plantillas precargadas. |

## Fuentes de contenido

`ContentGenerator` (`src/lib/content/generator.ts`) tiene dos implementaciones registradas en `src/lib/content/providers.ts`: plantillas (gratis, sin conexión) e IA (con la clave del usuario).

## Proyecto anterior (ReseñaQR)

El código de ReseñaQR quedó en la rama `resenaqr-archivo`. En este proyecto solo se conserva `web/redirect`, que `.github/workflows/pages.yml` publica en la raíz de GitHub Pages: es la redirección que mantiene funcionando los QR impresos. No borrarla.
