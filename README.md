# Carrusel Studio

Generador de carruseles para Instagram: brief → propuesta de estructura → revisión → diseño slide por slide → exportación PNG/ZIP.

Herramienta: **`/carousel-google-maps`** (la raíz `/` redirige ahí).

```bash
npm install
npm run dev        # http://localhost:3000/carousel-google-maps
npm test           # pruebas unitarias
npm run build      # compilación de producción (la misma que usa Vercel)
```

Se despliega en Vercel sin configuración extra (framework Next.js detectado automáticamente).

## Estructura

| Carpeta | Qué hay |
|---|---|
| `src/lib/types.ts` | Modelo de datos: proyecto, brief, diseño, slides. |
| `src/lib/formats.ts` | Formatos 1080×1440 / 1080×1350 y márgenes de seguridad. |
| `src/lib/content/` | Estructura narrativa y generación de contenido (hoy por plantillas; interfaz lista para sumar IA). |
| `src/lib/projectOps.ts`, `src/lib/store.ts` | Operaciones sobre el proyecto e historial deshacer/rehacer. |
| `src/components/slide/` | `<Slide number={...} />` a tamaño real, decoraciones y ajuste automático del texto. |
| `src/components/visuals/` | Elementos visuales (SVG/CSS). |
| `src/components/editor/` | Panel de configuración, planificación y editor. |

## Contenido sin IA

No hay ninguna API de IA configurada: la propuesta se arma con plantillas a partir del brief y la interfaz lo indica. Para sumar IA, implementar `ContentGenerator` (`src/lib/content/generator.ts`) y registrarlo en `src/lib/content/providers.ts`.

## Proyecto anterior (ReseñaQR)

El código de ReseñaQR quedó en la rama `resenaqr-archivo`. En `main` solo se conserva `web/redirect` y `.github/workflows/pages.yml`: la redirección de GitHub Pages que mantiene funcionando los QR impresos. No borrarlos.
