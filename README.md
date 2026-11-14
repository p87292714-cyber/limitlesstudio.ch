# LIMITLESS — Web de la agencia (Zúrich, alemán suizo)

Landing de una página para **LIMITLESS**, KI-Marketing für lokale Betriebe in Zürich. Todo el contenido está en alemán suizo (`lang="de-CH"`, «ss» en vez de «ß», CHF con apóstrofo, tratamiento de «Sie»).

La portada es un **hero de recorrido**: 240 fotogramas WebP pintados en un `<canvas>` según el scroll (GSAP ScrollTrigger + Lenis). El brief original del hero está en [`docs/HERO_PROMPT_ORIGINAL.md`](docs/HERO_PROMPT_ORIGINAL.md).

## Arrancar en local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
npm run preview    # sirve dist/ en local
```

En desarrollo, `?p=0.66` (u otro valor entre 0 y 1) salta a un punto concreto del recorrido. En producción se ignora.

## Estructura

| Archivo | Qué contiene |
|---|---|
| `index.html` | Todo el contenido (hero, Problem, Leistungen, Ablauf, Referenz, Preise, Branchen, FAQ, Kontakt) y SEO. |
| `src/style.css` | Estilos del prototipo (casi negro `#05070A`, lima `#B6FF3B`, Syne + Outfit) y del formulario. |
| `src/hero.js` | Hero de fotogramas: precarga (8 en paralelo), canvas *cover*, beats de texto por `data-start` / `data-end`. |
| `src/sections.js` | Animaciones reveal, enlace activo del menú, scroll a anclas con Lenis. |
| `src/contact.js` | Formulario y datos de contacto, que se configuran con variables de entorno. |
| `public/hero/frames/desktop/` | 240 fotogramas de 1920 px (unos 20,5 MB). |
| `public/hero/frames/mobile/` | 240 fotogramas de 1280 px (unos 14,2 MB). Se usan con un ancho de 767 px o menos. **Nunca se cargan las dos tandas.** |
| `public/hero/poster.webp`, `still.webp` | Primer fotograma y fotograma fijo para `prefers-reduced-motion`. |
| `public/og-image.jpg` | Imagen social 1200×630 sacada del póster. |
| `server/lead.js`, `api/lead.js`, `netlify/functions/lead.mjs` | Endpoint seguro `/api/lead` para Vercel y Netlify. |

### Tiempos de los textos del hero

| Progreso | Imagen | Texto |
|---|---|---|
| 0,00–0,055 | Arranque | Scrollen |
| 0,05–0,22 | Suelo agrietado | Das Problem |
| 0,31–0,39 | Despegue | Der Sprung |
| 0,58–0,75 | Visor con la Tierra | Die Lösung |
| 0,84–1,00 | Nubes y niebla verde | Zürich + CTA |

Si se cambian los fotogramas o se recorta el vídeo master, hay que **recalcular** estos valores.

## Formulario de contacto

- **Modo demostración** (por defecto): valida los campos, muestra un aviso y **no envía nada**.
- **Email** (`VITE_CONTACT_EMAIL`): abre la app de correo del visitante con la solicitud ya redactada.
- **Endpoint** (`VITE_LEAD_ENDPOINT=/api/lead`, recomendado): la función del servidor hace lo siguiente:
  - valida los campos y el consentimiento;
  - descarta los envíos de bots;
  - comprueba el origen si se configura `ALLOWED_ORIGIN`;
  - reenvía el lead a `LEAD_FORWARD_URL` (por ejemplo, n8n) con el secreto `LEAD_FORWARD_SECRET` en la cabecera `X-Limitless-Secret`.

  Los secretos nunca llegan al navegador.

El botón «15-Minuten-Gespräch buchen», los datos de contacto y los enlaces a Impressum y Datenschutz **solo se muestran si están configurados** (ver `.env.example`).

## Despliegue (Vercel o Netlify)

1. Sube el proyecto a un repositorio Git e impórtalo. Vercel detecta Vite automáticamente; en Netlify, `netlify.toml` ya define el build, la carpeta `dist` y las funciones.
2. Añade las variables de `.env.example` en el panel de la plataforma. Las `VITE_` se leen al compilar, así que hay que volver a desplegar tras cambiarlas.
3. `vercel.json` y `netlify.toml` ya sirven `/hero/*` y `/assets/*` con caché inmutable de un año.
4. Envía una solicitud de prueba y comprueba que llega a n8n o al CRM.

**Peso:** la home descarga unos 21 MB en escritorio y 14 MB en móvil, por diseño. El preloader cubre la espera. Para aligerarla, reduce a unos 180 fotogramas o baja la calidad a 70, y recalcula los tiempos de los textos.

## Checklist antes del lanzamiento

- [ ] Dominio definitivo y `VITE_SITE_URL`.
- [ ] Email, teléfono, WhatsApp y enlace de reserva (`VITE_CONTACT_*`, `VITE_WHATSAPP_URL`, `VITE_BOOKING_URL`).
- [ ] **Impressum y Datenschutzerklärung** publicados (obligatorios en Suiza, nDSG) y enlazados con `VITE_LEGAL_URL` / `VITE_PRIVACY_URL`.
- [ ] Destino real del formulario probado de principio a fin.
- [ ] Revisar las fuentes de las cifras (localsearch & HSLU 2025, IGEM-Digimonitor 2025) antes de publicarlas.
- [ ] El Beispiel-Audit sigue anonimizado y sin resultados inventados.
- [ ] Google Fonts se carga desde Google: valora alojarlas localmente por privacidad.
- [ ] Probar en iPhone y Android reales, también con «reducir movimiento» activado.

La versión anterior (React, en español) quedó guardada en `../_version-anterior-react/`.
