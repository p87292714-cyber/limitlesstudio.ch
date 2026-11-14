# LIMITLESS — Web de la agencia (Zúrich, alemán suizo) · versión «Reise»

Página única para **LIMITLESS**, KI-Marketing für lokale Betriebe in Zürich. Todo el contenido está en alemán suizo (`lang="de-CH"`, «ss» en vez de «ß», CHF con apóstrofo, trato de «Sie»).

El vídeo del astronauta (16,6 s en fotogramas WebP) está **fijo detrás de toda la página** y avanza con el scroll de principio a fin. Las secciones van en paneles de cristal oscuro y hay interludios a pantalla completa. El brief original está en [`docs/HERO_PROMPT_ORIGINAL.md`](docs/HERO_PROMPT_ORIGINAL.md): ahí están el mapeo scroll→tiempo, el sonido, el easter egg, etc.

## Arrancar en local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
npm run preview    # sirve dist/ en local
```

`?p=0.5` abre la página en ese punto del scroll (0–1); `?fine=1` fuerza el cursor y el HUD de escritorio. Solo sirven para revisar.

## Estructura

El prototipo «Reise» está integrado **sin reconstruirlo**: sus archivos están en `public/` y se cargan como scripts clásicos. Encima van las aportaciones de LIMITLESS, como módulo de Vite en `src/`.

| Archivo | Qué contiene |
|---|---|
| `index.html` | Markup del prototipo + marca LIMITLESS, SEO, enlace «saltar al contenido» y formulario en Kontakt. |
| `public/js/journey.js` | Fondo de fotogramas, mapeo scroll→tiempo (`ANCHORS`), Lenis, HUD, destello y niebla. |
| `public/js/sections.js` | Quiz, calculadora, slider, pestañas, split text, cursor propio, easter egg y pin de Leistungen. |
| `public/js/sound.js` | Sonido (Web Audio). Apagado por defecto; el audio solo se descarga al activarlo. |
| `public/css/style.css`, `journey.css` | Estilos del prototipo. |
| `public/frames/desktop/` | 400 fotogramas 1920×1080 a 24 fps (unos 34 MB). |
| `public/frames/mobile/` | 200 fotogramas 1280×720 a 12 fps (unos 9 MB). Se usan con un ancho de 767 px o menos; **nunca se cargan las dos tandas**. |
| `public/audio/` | Banda sonora en m4a, ogg y mp3. |
| `public/vendor/` | gsap 3.12.5, ScrollTrigger y lenis 1.1.20, servidos desde el propio dominio (sin CDN). |
| `src/contact.js`, `src/form.css` | Formulario y datos de contacto, configurables con variables de entorno. |
| `src/enhance.js` | Accesibilidad añadida: `aria-pressed` en las pastillas, tarjetas con teclado, Escape cierra el menú y foco tras saltar a un ancla. |
| `server/lead.js`, `api/lead.js`, `netlify/functions/lead.mjs` | Endpoint seguro `/api/lead` para Vercel y Netlify. |

**Cambios mínimos hechos en los archivos del prototipo:**
- `journey.js`: tope de 1,5 s a `decode()` en la precarga. En pestañas en segundo plano se quedaba esperando y el preloader no terminaba.
- `sound.js`: `localStorage` dentro de `try/catch`, para navegadores que lo bloquean.

**Orden de scripts (no cambiarlo):** gsap → ScrollTrigger → lenis → `sound.js` → `sections.js` → `journey.js`.

## Formulario de contacto

- **Modo demostración** (por defecto): valida los campos, muestra un aviso y **no envía nada**.
- **Email** (`VITE_CONTACT_EMAIL`): abre la app de correo del visitante con la solicitud redactada.
- **Endpoint** (`VITE_LEAD_ENDPOINT=/api/lead`, recomendado): la función del servidor hace lo siguiente:
  - valida los campos y el consentimiento;
  - descarta los envíos de bots;
  - comprueba el origen si se configura `ALLOWED_ORIGIN`;
  - reenvía el lead a `LEAD_FORWARD_URL` (por ejemplo, n8n) con `LEAD_FORWARD_SECRET` en la cabecera `X-Limitless-Secret`.

  Los secretos nunca llegan al navegador.

El botón de reserva, los datos de contacto y los enlaces a Impressum y Datenschutz **solo se muestran si están configurados** (ver `.env.example`).

## Despliegue (Vercel o Netlify)

1. Sube el proyecto a GitHub e impórtalo. Vercel detecta Vite automáticamente; en Netlify, `netlify.toml` ya define el build, la carpeta `dist` y las funciones.
2. Añade las variables de `.env.example`. Las `VITE_` se leen al compilar, así que hay que volver a desplegar tras cambiarlas.
3. `/frames/*`, `/audio/*`, `/vendor/*` y `/assets/*` se sirven con caché inmutable de un año.

**Peso:** antes de mostrar la página solo se esperan 16 fotogramas (unos 2,3 MB en escritorio y 1,1 MB en móvil). El resto se carga en segundo plano: unos 34 MB en total en escritorio y 9 MB en móvil.

## Checklist antes del lanzamiento

- [ ] Dominio definitivo y `VITE_SITE_URL`.
- [ ] Email, teléfono, WhatsApp y enlace de reserva (`VITE_CONTACT_*`, `VITE_WHATSAPP_URL`, `VITE_BOOKING_URL`).
- [ ] **Impressum y Datenschutzerklärung** publicados (obligatorios en Suiza, nDSG) y enlazados con `VITE_LEGAL_URL` / `VITE_PRIVACY_URL`.
- [ ] Destino real del formulario probado de principio a fin.
- [ ] **Bloque de referencias en «Beispiel-Audit»** (`.slots[data-placeholder="referenzen"]`): ahora muestra `[PLATZHALTER …]` y `[LOGO]`. Sustitúyelo por contenido real o bórralo.
- [ ] Precios: son recomendados, no validados.
- [ ] Valores iniciales de la calculadora: con ellos el neto sale **−CHF 330**. Decide si los mantienes.
- [ ] Logo: el cuadrado lima es provisional (el easter egg se activa con 5 clics en él).
- [ ] Probar en un iPhone real (Safari) y en un Android de gama media, también con «reducir movimiento» y con el sonido activado.
- [ ] Google Fonts (Archivo, Outfit) se carga desde Google: valora alojarlas localmente por privacidad.
