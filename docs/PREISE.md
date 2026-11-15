# Precios LIMITLESS: referencia de mercado y decisión (15-11-2026)

## Estrategia elegida: «Intermedio»

Precio regular claramente por debajo del mercado suizo, para que sea accesible a negocios locales. Además, un **precio piloto −30 %** para los 5 primeros clientes, garantizado 12 meses. Después rige el precio regular.

| Paquete | Pilot / mes | Regular / mes | Pilot alta | Regular alta | Referencia de mercado / mes* |
|---|---|---|---|---|---|
| Digital-Check | CHF 0 | CHF 0 | – | – | – |
| Starter «Sichtbar» | **CHF 490** | CHF 690 | CHF 690 | CHF 990 | ≈ CHF 1'800 |
| Growth «Voll» | **CHF 1'040** | CHF 1'490 | CHF 1'740 | CHF 2'490 | ≈ CHF 3'800 |
| Premium «Automatisch» | **CHF 1'880** | CHF 2'690 | CHF 3'430 | CHF 4'900 | ≈ CHF 6'000 |

Extras: el único cambio es «4 zusätzliche Kurzvideos», que pasa de CHF 390 a CHF 590 (en el mercado, unos CHF 1'500 por 4 vídeos). Los demás extras ya estaban dentro de los rangos del mercado.

\* **Referencia de mercado** = suma de los componentes de cada paquete con precios publicados por agencias suizas:
- **Starter:** perfil de Google (≈ 300/mes) + 4 vídeos (≈ 1'500/mes).
- **Growth:** perfil de Google + unos 10 vídeos (≈ 3'500/mes), sin contar la newsletter.
- **Premium:** perfil de Google + 16 vídeos (≈ 5'300/mes) + gestión de anuncios (≈ 450/mes), sin contar chatbot ni CRM.

## Datos de mercado encontrados (Suiza, precios publicados por las propias agencias)

| Servicio | Rango publicado | Fuentes |
|---|---|---|
| Gestión del perfil de Google | CHF 120–500 / mes; alta CHF 350–2'500 | [velixar.ch](https://velixar.ch/google-unternehmensprofil-schweiz), [janineannen.ch](https://www.janineannen.ch/google-unternehmensprofil), [mikgroup.ch](https://www.mikgroup.ch/preise/), [hyperpage.ch](https://www.hyperpage.ch/service/seo-agentur) |
| Social media (agencia, KMU) | CHF 750–3'000 / mes en mandatos pequeños; 3'000–8'000 en gestión completa | [blog.publy.ch](https://blog.publy.ch/social-media-marketing-agentur-kosten-zuerich), [adringo.ch](https://www.adringo.ch/post/social-media-outsourcing-schweiz-kmu), [uovo.ch](https://www.uovo.ch/social-media-agentur) |
| Vídeos cortos en suscripción | CHF 1'500 / 4 vídeos, 3'000 / 8, 3'999 / 12; un vídeo suelto, CHF 350–2'000 | [offscript.ch](https://offscript.ch/), [influential.ch](https://influential.ch/blog/kurzvideo-kosten-schweiz-2026), [esysagency.ch](https://esysagency.ch/video-foto-produktion) |
| Web de una página | CHF 300–2'500 | [klaroweb.ch](https://www.klaroweb.ch/was-kostet-eine-website-in-der-schweiz-2026/), [velixar.ch](https://velixar.ch/webseiten-kosten-schweiz) |
| Web KMU (5–10 páginas) | CHF 1'500–8'000 (en Zúrich, a menudo 4'000–10'000) | [garcon-studios.ch](https://garcon-studios.ch/website-kosten-zuerich/), [0ggi.ch](https://www.0ggi.ch/de/blog/was-kostet-eine-website-schweiz) |

Son orientativos: no hay una estadística oficial, y cada agencia publica sus propios precios. Conviene revisarlos cada cierto tiempo.

## Calculadora

Rangos y valores de ejemplo por sector (en `src/enhance.js`, `SECTOR_CALC`). Son **suposiciones de ejemplo**, no medidas: revísalas con datos reales.

| Sector | Clientes (ejemplo / máx.) | Ticket (ejemplo, rango) | Visitas/mes máx. | Margen |
|---|---|---|---|---|
| Gastro | 20 / 40 | 50 (15–120) | 2 | 65 % |
| Coiffeur | 10 / 20 | 80 (30–250) | 1 | 70 % |
| Fitness | 8 / 15 | 100 (40–150), cuota mensual | 1 | 80 % |
| Laden | 30 / 50 | 45 (10–200) | 2 | 40 % |
| Praxis | 10 / 20 | 120 (60–250) | 2 | 60 % |
| Handwerk | 2 / 8 | 1'500 (300–5'000), valor del encargo | 1 | 35 % |
| Hotel | 10 / 30 | 300 (100–600), por estancia | 1 | 70 % |

Antes, con todos los deslizadores al máximo, la calculadora daba unos CHF 215'000. Ahora el máximo es de unos CHF 9'600 en Gastro y CHF 40'000 en Handwerk (8 encargos de CHF 5'000).
