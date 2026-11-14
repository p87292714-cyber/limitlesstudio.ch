# Prompt para integrar la web «Reise» (pegar en Claude)

Copia todo lo que va debajo de la línea y pégalo en Claude junto con la carpeta `scroll-hero` (o su ruta en el repo). La web ya está terminada y probada: **intégrala, no la reconstruyas**, no sustituyas los fotogramas por un `<video>` y no cambies los textos.

---

Estoy montando la web de mi agencia de marketing con IA para negocios locales en Zúrich. **Todo el contenido está en alemán suizo (`<html lang="de-CH">`, «ss» en vez de «ß», precios en CHF con apóstrofo, trato de «Sie»). No lo traduzcas ni cambies el tono.** Todas las cifras de la web tienen fuente (localsearch & HSLU 2025, IGEM 2025) o salen de mi documento de agencia. **No inventes cifras, clientes, logos, testimonios ni resultados.** Estoy empezando el negocio: los huecos para contenido real están marcados como placeholder y se quedan así hasta que yo tenga el material.

## Qué es

Una sola página. El vídeo del astronauta (16,6 s, en fotogramas WebP) está **fijo de fondo detrás de toda la página** y avanza con el scroll de principio a fin. Cada sección enseña su momento de la historia. El contenido va en paneles de cristal oscuro (`backdrop-filter: blur`). Cuando hay texto en pantalla, el fondo se oscurece y se desenfoca un poco; en los «Zwischenspiele» (interludios) se ve limpio. Paleta: `#05070A` y lima `#B6FF3B`. Tipografías: **Archivo** (titulares, ancho 112 %, peso 800–900) y **Outfit** (texto).

## Carpeta

```
scroll-hero/
  index.html
  css/style.css          estilos base de las secciones
  css/journey.css        fondo fijo, paneles de cristal, interludios, cursor, sonido, HUD, quiz
  js/journey.js          fondo de fotogramas + mapeo scroll→tiempo + Lenis (expone window.__lenis, window.__journey)
  js/sections.js         quiz, calculadora, slider, tabs, split text, cursor, easter egg, pin de Leistungen
  js/sound.js            sonido (Web Audio), apagado por defecto
  audio/soundtrack.m4a   (AAC 128 kbps) · soundtrack.ogg (Vorbis) · soundtrack.mp3 (128 kbps)
  frames/desktop/0001–0400.webp   1920×1080, 24 fps (1 fotograma = 1/24 s)
  frames/mobile/0001–0200.webp    1280×720, 12 fps
  poster.webp · still.webp · favicon.svg · favicon-32.png · apple-touch-icon.png
```

Sube `frames/`, `audio/` y las imágenes a una ruta pública con caché larga (`Cache-Control: public, max-age=31536000, immutable`) y HTTP/2 o HTTP/3. Si cambias las rutas, actualiza `SETS` en `js/journey.js` y `SRC` en `js/sound.js`.

## Arquitectura

**Orden de los scripts (importante):** gsap → ScrollTrigger → lenis → `sound.js` → `sections.js` → `journey.js`. `sections.js` crea primero el pin horizontal de «Leistungen» y después el resto de ScrollTriggers. Si cambias el orden, las posiciones posteriores al pin salen desplazadas.

**Fondo (`js/journey.js`):**
- Un `<canvas id="bg-canvas">` dentro de `.stage` (`position: fixed`, z-index 0). Todo el contenido va por encima (z-index 2–3).
- Carga: primero el primer pantallazo (`HERO_T = 1,25 s`) con el preloader: uno de cada dos fotogramas en desktop (16) y todos en móvil (16). Luego el resto en segundo plano, de grueso a fino (cada 16, 8, 4, 2 y 1), con prioridad para los fotogramas cerca de donde está el usuario. Si falta uno, se pinta el más cercano ya cargado. **Nunca se cargan las dos tandas:** móvil (`max-width: 767px`) usa `frames/mobile/`.
- DPR limitado: el canvas nunca tiene más píxeles que el propio fotograma (máximo 2×). Solo se redibuja cuando cambia el fotograma.
- Suavizado: el tiempo mostrado sigue al tiempo objetivo con interpolación (0,3 desktop / 0,22 móvil), además de Lenis.
- En vertical (móvil), el encuadre sigue al astronauta (a la derecha del centro mientras camina, centrado después).

**Mapeo scroll → tiempo del vídeo** (`ANCHORS` en `journey.js`, lineal por tramos; `top` = borde superior de la sección arriba del viewport, `end` = borde inferior abajo):

| Sección | Tiempo del vídeo | Qué se ve |
|---|---|---|
| Hero (`#hero-sequence`, 210vh) | 0 → 1,6 s | Intro: camina sobre el suelo agrietado |
| Das Problem + quiz (`#problem`) | 1,6 → 3,4 s | Suelo agrietado, la energía empieza a subir |
| Interludio «Der Sprung» (`#sprung`) | 3,4 → 6,75 s | Energía, despegue (cuenta atrás 3-2-1-Los), destello |
| Destello como cortinilla hacia Leistungen | ≈ 6,4–7,2 s | Capa `#wipe` blanca-lima por encima de todo, pico en 6,8 s |
| Leistungen (pin horizontal) | 7,1 → 8,6 s | La Tierra desde arriba |
| Interludio «Die Lösung» (`#loesung`) | 8,6 → 9,7 s | Se acerca al visor (retícula «Scan · 15 Prüfpunkte») |
| Ablauf + Beispiel-Audit (`#ablauf`, `#referenz`) | 9,7 → 12,3 s | Primer plano del visor |
| Rechner + Pakete (`#preise`) | 12,5 → 14,8 s | Caída en picado hacia las nubes |
| Branchen + FAQ | 14,8 → 15,7 s | Nubes |
| Interludio final (`#finale`) | 15,7 → 16,3 s | Niebla verde (capa `#mist`) |
| Kontakt + footer | 16,3 → 16,62 s | Niebla verde final |

Si cambias alturas de secciones, el mapeo se recalcula solo (en cada `ScrollTrigger.refresh`). Si cambias el vídeo, ajusta los tiempos de `ANCHORS`, `STILLS`, `CHAPTERS` y el pico del destello en `updateFx()`. No los adivines: mira los fotogramas.

**Foco:** mientras una `.sec` ocupa el centro, `body.bg-focus` aplica `blur(5px) brightness(.62)` al canvas (móvil: `blur(9px)`). En los interludios y en Leistungen el fondo se ve nítido. En móvil los paneles no usan `backdrop-filter` (por rendimiento) y llevan un cristal más opaco.

**Reduced motion** (`prefers-reduced-motion: reduce`): sin Lenis ni scrub. Se carga un único fotograma fijo por sección (`STILLS`) y se cambia al entrar en cada una. No hay cuenta atrás, retícula ni split text, y los interludios pasan a tener altura normal.

## Pulido premium

- **Split text:** los titulares `[data-split="words"]` suben palabra a palabra desde una máscara. Los interludios `[data-split="chars"][data-scrub]` aparecen letra a letra ligados al scroll. El título conserva el texto en `aria-label`.
- **Transiciones:** el destello del vídeo hace de cortinilla hacia «Leistungen», la niebla cierra la página y los interludios se desvanecen con blur al salir.
- **Microinteracciones:** botones con relleno que nace desde el puntero, botones magnéticos y tilt en las tarjetas. Cursor propio solo en desktop (`hover: hover` y `pointer: fine`): crece sobre lo clicable y muestra «Mehr» en las tarjetas y «Ziehen» en los sliders. Vibración háptica (`navigator.vibrate`) en móvil al responder el quiz y en los chips (no funciona en iPhone, porque Safari no lo soporta).
- **Quiz en formato juego:** barra de 5 pasos, etiqueta flotante «+1 Leck» o «Dicht» en cada respuesta y pulso rojo. Al terminar hay un escaneo del anillo, un diagnóstico («Dicht», «Kleine Lecks», «Deutliche Lecks» o «Alarmstufe Rot»), partículas y el botón «Nochmals testen».
- **HUD de capítulos** (desktop ≥ 1101 px): contador `T+ 07.5 s` y seis capítulos clicables (Boden, Sprung, Orbit, Visier, Sturzflug, Nebel).
- **Easter egg:** 5 clics rápidos en el cuadrado lima del logo activan el «Schwerelos-Modus»: los elementos visibles flotan unos segundos y suena un whoosh.
- **Favicon:** rombo lima sobre negro (`favicon.svg`, con PNG de respaldo).
- `?p=0.5` abre la página en ese punto del scroll (0–1), útil para revisar. `?fine=1` fuerza el modo desktop del cursor y del HUD (solo para pruebas). En producción se pueden quitar.

## Sonido (`js/sound.js`)

- Botón «Ton an / Ton aus» en la navegación, **apagado por defecto**, porque los navegadores bloquean el autoplay. El estado se guarda en `localStorage` (`agentur-sound`). Si estaba encendido en la visita anterior, el sonido arranca con el primer clic, toque o tecla.
- **Origen:** el audio original de los dos clips (`final_a.mp4` y `final_b.mp4`), unido con el mismo crossfade de 0,4 s que el vídeo, de modo que sigue la línea de tiempo del master (16,7 s), normalizado a −18 LUFS. No hay música ni sonidos externos con licencias dudosas.
- **Fondo ambiental:** en el navegador se construye un loop sin costura (el final se funde 2 s sobre el principio). Pasa por un filtro paso bajo que se abre y sube de volumen según la velocidad del scroll. Debajo hay un drone grave sintetizado, muy suave.
- **Scrub:** mientras haces scroll, suenan «granos» de 0,24 s del trozo de audio que corresponde al momento exacto del vídeo (granular, sin cortes). Por eso el despegue y las caídas suenan donde se ven.
- **Sonidos de interfaz** generados con Web Audio: clic suave, sí y no en el quiz, acorde de resultado, tic en los sliders y whoosh del easter egg.
- Fundidos de entrada y salida. Se silencia y suspende el `AudioContext` cuando la pestaña está oculta. El audio solo se descarga cuando el usuario activa el sonido.

## Placeholders que NO hay que rellenar inventando

- `[AGENTUR]`: nombre o logo (nav y footer). El cuadrado lima es un logo provisional.
- Kontakt: `mailto:[E-MAIL]`, enlace de reserva `href="#"` y la línea `[PLATZHALTER: E-Mail, Telefon, WhatsApp-Link und Buchungslink einsetzen]`.
- Impressum y Datenschutz (`href="#"`), obligatorios en Suiza antes de publicar.
- En «Beispiel-Audit», el bloque `.slots[data-placeholder="referenzen"]`: primera fallstudie con resultados medidos, testimonio o vídeo de cliente y franja de 4 logos. **Hay que sustituirlo o borrarlo antes de publicar.** Ahí solo va contenido real.
- El Beispiel-Audit está anonimizado y muestra un plan, no resultados medidos. Mantén la nota.
- Los precios son recomendados, no validados. Revísalos antes de publicar.

## Integración

1. Copia la carpeta tal cual o porta el markup de `.stage`, `#wipe`, `#preloader`, la nav y las secciones en este orden. Las secciones deben tener fondo transparente.
2. Mantén las dependencias por CDN (gsap 3.12.5 + ScrollTrigger, lenis 1.1.20, Google Fonts) o instálalas por npm con el mismo comportamiento. Si el proyecto ya tiene smooth scroll, no instales un segundo Lenis: engancha `ScrollTrigger.update` al que ya exista.
3. No dejes que un reset CSS pise `position: sticky` de `.hero-sticky` y `.gap-sticky`, ni `position: fixed` de `.stage`.

## Rendimiento

- Desktop: 400 WebP (≈ 35,8 MB en total, unos 90 KB por fotograma). Móvil: 200 WebP (≈ 9,6 MB). Antes de mostrar la página solo se esperan 16 fotogramas: ≈ 2,3 MB en desktop y ≈ 1,1 MB en móvil.
- Si hace falta aligerar: calidad 65–70, o 300 fotogramas en desktop (recalcula `count` y `fps` en `SETS`).
- Pruébala en un iPhone real (Safari) y en un Android de gama media antes de publicar.
