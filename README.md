# Carrusel Studio

Generador de carruseles para Instagram: brief → propuesta de estructura → revisión → diseño slide por slide → exportación PNG/ZIP.

Herramienta: **`/carousel-google-maps`** (la raíz `/` redirige ahí).

```bash
npm install
npm run dev        # http://localhost:3000/carousel-google-maps
npm test           # pruebas unitarias
npm run typecheck  # verificación de tipos
npm run build      # compilación de producción (la misma que usa Vercel)
```

Se despliega en Vercel sin configuración extra: importar el repositorio y aceptar los valores detectados (Next.js).

## Cómo se usa

0. **Tipo de carrusel** (obligatorio antes de proponer): Negocios, Crecimiento personal, Motivación, Mi proceso o Hábitos y productividad. Cambia los nombres de los campos, el papel de cada slide, los textos base y los visuales sugeridos. En "Mi proceso" quedan textos `[entre corchetes]` para completar con tu historia; la exportación avisa si queda alguno.
1. **Brief** (panel izquierdo): temática, negocio, objetivo, público, problema, beneficio, servicio, llamada a la acción, tono e instrucciones. Las líneas de las instrucciones que empiezan con `-` o un número se usan como consejos propios.
2. **Proponer estructura**: arma de 1 a 10 slides con estructura narrativa (gancho, problema, ejemplo, cómo funciona, argumento, consejos, CTA).
3. **Revisión**: se edita cada título, subtítulo, texto y visual. Nada pasa al diseño hasta tocar **Aprobar**.
4. **Diseño**: lienzo con vista individual o de todos, zoom, área segura y márgenes; tira de miniaturas (arrastrar para reordenar); panel derecho para editar el slide seleccionado (textos, visual, imagen, alineación, colores, tamaños, duplicar, mover, eliminar).
5. **EXPORTAR A PNG**: un ZIP o PNG individuales numerados, con la medida exacta (1080×1440 o 1080×1350).

Atajos: `Ctrl/Cmd+Z` deshacer, `Ctrl/Cmd+Shift+Z` rehacer, `Ctrl/Cmd+S` guardar, flechas para cambiar de slide.
En los textos, `*palabra*` se resalta con el color de acento.

## Proyectos

Se guardan solos en el navegador (localStorage), sin base de datos. Desde **Proyectos**: nuevo, abrir, duplicar, renombrar, eliminar, descargar copia `.json` e importar. Al volver se abre el último proyecto. En **Diseño → Mis diseños** se guardan combinaciones de colores, tipografías y tamaños para reutilizar.

La primera vez se precarga el ejemplo **"Cómo las reseñas de Google Maps llenan tu local"** (10 slides, negocios). Plantillas disponibles: ese ejemplo y **"Lo que nadie te dice sobre la constancia"** (7 slides, crecimiento personal).

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
| `src/lib/storage/` | Persistencia (interfaces + implementación localStorage). |
| `src/lib/export/` | Captura PNG, ZIP y descargas. |
| `src/components/slide/` | `<Slide number={...} />` a tamaño real, decoraciones y ajuste automático del texto. |
| `src/components/visuals/` | Visuales en SVG/CSS: generales y de Google Maps. |
| `src/components/editor/` | Interfaz del editor. |
| `src/data/templates/` | Plantillas precargadas. |

## Contenido sin IA

No hay ninguna API de IA configurada: la propuesta se arma con plantillas a partir del brief, y la interfaz lo indica. Para sumar IA, implementar `ContentGenerator` (`src/lib/content/generator.ts`), idealmente llamando a una ruta del servidor que tenga la clave en una variable de entorno, y registrarlo en `src/lib/content/providers.ts`.

## Almacenamiento en la nube (a futuro)

`src/lib/storage/types.ts` define `ProjectRepository` y `PresetRepository`. Para guardar en la nube, implementarlas contra una API y cambiar las instancias en `src/lib/storage/index.ts`.

## Proyecto anterior (ReseñaQR)

El código de ReseñaQR quedó en la rama `resenaqr-archivo`. En este proyecto solo se conserva `web/redirect` y `.github/workflows/pages.yml`: la redirección de GitHub Pages que mantiene funcionando los QR impresos. No borrarlos.
