# Prompt para integrar el hero de recorrido (pegar en Claude)

Copia todo lo que va debajo de la línea e inclúyelo en Claude junto con la carpeta `scroll-hero` (o su ruta en el repo). No hace falta rehacer el hero: hay que integrarlo.

---

Estoy montando la web de mi agencia digital, pensada para negocios locales en Zúrich. **Todo el contenido de la web está en alemán suizo (`<html lang="de-CH">`, «ss» en vez de «ß», precios en CHF con apóstrofo, tratamiento de «Sie»). No lo traduzcas a otro idioma ni cambies ese tono.** Ya tengo un hero de recorrido sincronizado con el scroll, terminado y probado. Quiero que lo integres en la web existente. No lo reconstruyas desde cero ni sustituyas los fotogramas por un `<video>`.

La historia del hero: un astronauta cruza el problema (suelo agrietado) y llega a la solución (la Tierra, el visor, las nubes). Paleta: casi negro `#05070A` y lima neón `#B6FF3B`. Tipografías del prototipo: Syne (titulares) y Outfit (UI). Si la web ya tiene una tipografía de marca, úsala, pero mantén el contraste y el lima.

## Carpeta

```
scroll-hero/
  index.html
  css/style.css
  js/hero.js           hero de fotogramas (expone window.__lenis)
  js/sections.js       animaciones reveal (GSAP) y enlace activo del menú
  poster.webp          primer fotograma (útil también para Open Graph)
  still.webp           fotograma fijo para prefers-reduced-motion
  frames/desktop/0001.webp … 0240.webp   1920 px de ancho, ~21,5 MB
  frames/mobile/0001.webp  … 0240.webp   1280 px de ancho, ~14,9 MB
```

Sube `frames/`, `poster.webp` y `still.webp` a una ruta pública del hosting (Vercel, Netlify u otro), por ejemplo `/hero/`. Si cambias la ruta, actualiza `CONFIG.desktopPath` y `CONFIG.mobilePath` en `js/hero.js`, y los `src` de `poster.webp` / `still.webp`.

## Cómo funciona

El scroll no reproduce un vídeo. Pinta 240 fotogramas WebP, uno a uno, en un `<canvas>` a pantalla completa, según el progreso de una sección de unos `600vh` con el canvas en `position: sticky`. Es el mismo recurso que la web de referencia tipo Cortex.

Lógica en `js/hero.js`:

- Precarga los 240 fotogramas (desktop o móvil según `max-width: 767px`) con un preloader de porcentaje. La concurrencia es 8. No se quita el preloader hasta que la tanda está lista, para que el scrub no encuentre huecos.
- Lenis suaviza el scroll. GSAP ScrollTrigger mapea el progreso `0–1` de `#hero-sequence` a los fotogramas (`scrub: 0.2`).
- El canvas se dibuja en *cover*, con `devicePixelRatio` limitado a 2. Solo se redibuja si cambia el fotograma o el tamaño de la ventana.
- Los textos van en HTML superpuesto, nunca dentro de las imágenes. Cada bloque tiene `data-start`, `data-end` y `data-fade` en progreso `0–1`.
- Si el usuario tiene `prefers-reduced-motion: reduce`, no se cargan los 240 fotogramas. Se muestra `still.webp` a pantalla completa y el CTA final. La sección pasa a medir `100vh`.

Dependencias por CDN, sin paso de build:

- gsap 3.12.5 + ScrollTrigger
- lenis 1.1.20 (JS y CSS)
- Google Fonts: Syne y Outfit

Si el proyecto ya tiene un scroll suave, no instales un segundo Lenis: engancha `ScrollTrigger.update` al scroller que ya exista.

## Tiempos de los textos

El master dura 16,71 s (401 fotogramas a 24 fps). El progreso `1` es el último fotograma (`t ≈ 16,67 s`).

| Beat | Progreso | Tiempo aprox. | Qué se ve | Texto actual (placeholder) |
|---|---|---|---|---|
| Pista de scroll | 0,00–0,055 | 0–0,9 s | Arranque, suelo agrietado | Desliza |
| El problema | 0,05–0,22 | 0,8–3,7 s | Camina sobre el suelo agrietado | *El problema.* Tu negocio pierde clientes por errores que no ves. Auditoría digital para negocios locales en Zúrich. |
| (sin texto) | 0,22–0,31 | 3,7–5,2 s | La energía crece | — |
| El salto | 0,31–0,39 | 5,2–6,5 s | Despegue, justo antes del destello | *El salto.* Cruzamos el problema. |
| (sin texto) | 0,39–0,58 | 6,5–9,7 s | Destello blanco-verde que se abre a la Tierra | Dejar respirar la imagen |
| La solución | 0,58–0,75 | 9,7–12,5 s | Primer plano del visor, la Tierra reflejada | *La solución.* Encontramos lo que frena tu negocio y lo digitalizamos. |
| (sin texto) | 0,75–0,84 | 12,5–14,0 s | Caída de lado, entra en las nubes | — |
| CTA | 0,84–1,00 | 14,0–16,7 s | Atraviesa las nubes y cierra en niebla verde | *Zúrich.* ¿Listo para ver lo que está fallando? Botón: Solicitar auditoría |

Si cambias el número de fotogramas o recortas el master, hay que recalcular estos `data-start` / `data-end`. No los adivines.

El prototipo acepta `?p=0.66` (u otro valor entre 0 y 1) para revisar un punto del recorrido en desarrollo. En producción se puede ignorar o quitar.

## Cómo integrarlo en la web

1. Copia fotogramas y assets al proyecto y súbelos a la ruta pública acordada.
2. Coloca el markup de `#preloader` y `#hero-sequence` al inicio de la home, como primera sección. La navegación de la web puede sustituir a la del prototipo, pero debe quedar fija y legible (claro / lima) sobre el recorrido.
3. Incorpora `css/style.css`, o porta las variables (`--lime`, `--bg`, etc.) y los bloques `#preloader`, `#hero-sequence`, `.hero-*` a tu CSS. No dejes que un reset pise `height: 600vh` ni `position: sticky`.
4. Carga `js/hero.js` y las dependencias CDN (o instálalas por npm si el proyecto ya usa un bundler, manteniendo el mismo comportamiento).
5. Las secciones de servicios, método y contacto van **después** de `#hero-sequence`. En el prototipo hay dos bloques de relleno (`#servicios`, `#contacto`) con el correo `hola@example.com` y el wordmark «Agencia»: sustitúyelos por la marca, los enlaces y el contacto reales.
6. Los iconos de servicios no van pintados en el vídeo. Si deben aparecer en un momento del recorrido, añádelos como overlays HTML con su propio `data-start` / `data-end`, igual que los textos.

## Rendimiento

- Desktop: 240 WebP a 1920 px, calidad 75, unos 21,5 MB en total. Móvil: 1280 px, unos 14,9 MB. **No cargues las dos tandas a la vez.**
- Sirve los WebP con caché larga (`Cache-Control` inmutable) y HTTP/2 o HTTP/3.
- El peso de la home será alto por diseño; el preloader cubre la espera. Si hace falta aligerar: bajar a ~180 fotogramas, calidad 70, o precargar un subconjunto y el resto en segundo plano (con el riesgo de algún hueco si el usuario hace scroll rápido).
- El hero va silenciado. No cargues el audio del master.

## Qué no hacer

- No incrustes un `<video>` con *playback* en lugar de los fotogramas: en scroll se desincroniza y pierde fluidez.
- No recortes ni reexportes los fotogramas con otro intervalo sin recalcular los beats.
- No pongas texto dentro de las imágenes.
- No dupliques Lenis u otro *smooth scroll* si la web ya tiene uno.

Cuando lo integres, respeta el look (fondo casi negro, lima `#B6FF3B`) y dime si hay conflicto con el framework, el router o el sistema de scroll de la web.


## Estructura actual de la página (versión interactiva, contenido en alemán de-CH)

Debajo del hero, cada sección es algo que el usuario toca o hace; el texto está reducido a titulares cortos y los detalles van detrás de interacciones. Lógica en `js/sections.js` (sin librerías extra aparte de GSAP, ScrollTrigger y Lenis):

| Ancla | Sección | Interacción |
|---|---|---|
| `#problem` | Das Problem | Contadores animados (77 %, 3 %, 36 %, 63 %, con fuente) + Mini-Digital-Check: 5 preguntas sí/no → anillo animado con el número de fugas y CTA |
| `#leistungen` | Leistungen | 6 tarjetas en scroll horizontal fijado (GSAP pin, ≥768 px); en móvil, deslizamiento con scroll-snap. Hover/tap: tilt 3D y detalle desplegable |
| `#ablauf` | Ablauf | Línea de tiempo que se dibuja con el scroll (horizontal en desktop, vertical en móvil), 4 pasos |
| `#referenz` | Beispiel-Audit | Slider antes/después (`#ba-range`): «Vorher · Diagnose» vs «Nachher · Plan». Sternen anonimizado; «Nachher» es el plan, NO resultados |
| `#preise` | Rechner + Pakete | Calculadora (chips de sector con su KPI, sliders, selector de paquete) + tarjetas de paquetes con toggle Monatlich/Einrichtung; la tarjeta del paquete elegido en la calculadora se resalta. Extras en desplegable |
| `#branchen` | Branchen | Chips de 8 sectores que cambian al momento el panel (fugas típicas, solución, KPI) |
| `#faq` | FAQ | Acordeón, solo uno abierto a la vez |
| `#kontakt` | Kontakt | CTA con botones magnéticos |

Fórmula de la calculadora (del documento de referencia de la agencia): `Umsatz = Kunden × Bon × Besuche`; `Deckungsbeitrag = Umsatz × Marge %`; `Netto = Deckungsbeitrag − Paketgebühr`; `Break-even = Gebühr ÷ (Bon × Besuche × Marge %)`. Valores iniciales del documento: 15 clientes, CHF 40, 1 visita, 60 %, Growth CHF 690. Está marcada como estimación («Schätzung … kein Versprechen»); mantén esa etiqueta.

Global: barra de progreso de scroll, brillo lima que sigue al cursor (solo desktop con ratón), botones magnéticos, reveal al entrar en pantalla, menú hamburguesa por debajo de 900 px. Con `prefers-reduced-motion` se desactivan glow, tilt, pin y animaciones; los contadores muestran el valor final.

Pendientes marcados: `[AGENTUR]`, `mailto:[E-MAIL]`, enlace de «15-Minuten-Gespräch buchen», `[PLATZHALTER: …]`, Impressum y Datenschutz (obligatorios en Suiza). No inventes cifras ni resultados nuevos; si integras en otra web, conserva los IDs que usa `sections.js`.
