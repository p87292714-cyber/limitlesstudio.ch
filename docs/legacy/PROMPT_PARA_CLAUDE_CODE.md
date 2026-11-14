# PROMPT PARA CLAUDE CODE — LIMITLESS

Actúa como un **director creativo web + senior frontend engineer + especialista CRO B2B**. Estás dentro de un proyecto React/Vite existente llamado `limitless-website`, una agencia de soluciones de inteligencia artificial y automatización para empresas de diferentes sectores. NO empieces de cero sin revisar el código que ya existe.

## 1. Objetivo de negocio

LIMITLESS ayuda a empresas y locales (restaurantes, gimnasios, clínicas, comercio, servicios, etc.) a detectar problemas que frenan sus ventas o sus operaciones y a implantar soluciones a medida. El valor no es «vender IA», sino **generar oportunidades de venta, reducir tareas repetitivas, mejorar atención al cliente y ayudar al negocio a funcionar con menos fricción**, sobre todo en horas punta. El objetivo medible de la web es convertir tráfico cualificado en solicitudes de diagnóstico y reuniones comerciales.

## 2. Dirección de arte obligatoria

- Marca: **LIMITLESS** / concepto: «soluciones sin límites» / símbolo de infinito **∞**.
- Estilo: futurista, astral, cinematográfico, sofisticado; un universo de galaxias, luz azul eléctrico, púrpura, magenta suave, estrellas sutiles y un planeta en el horizonte.
- La imagen de portada real está en `public/astronaut-cosmos.webp`; el moodboard completo está en `references/concepto-visual-limitless.png`.
- En el hero, el astronauta mira un planeta y lleva el símbolo ∞. Debe ser una experiencia premium **legible y orientada a ventas**. No invadas los textos con la foto.
- Diseño tipo producto premium / SaaS: tipografía Space Grotesk para titulares, DM Sans para texto, glassmorphism ligero, tarjetas translúcidas, halos luminosos, animaciones suaves y diagramas explicativos. Nada de contadores irreales ni fake social proof.
- Responsive primero, con diseño espectacular en desktop y claro en móviles. Respetar `prefers-reduced-motion` y un rendimiento razonable. Evita WebGL y vídeos gigantes salvo justificación real.

## 3. Experiencia que debe mantenerse y mejorarse

1. **Hero** con mensaje: «El próximo nivel de tu negocio no tiene límites» + beneficio y botón «Descubre tu potencial».
2. **Diagnóstico interactivo**: opciones «Se escapan oportunidades», «Demasiado trabajo repetitivo», «Caos en horas punta». El panel inferior cambia texto, flujo visual y CTA de acuerdo con la selección.
3. **Tres soluciones** y resultados esperados explicados en lenguaje de negocio.
4. **Demostración por sectores** (restaurante, gimnasio, clínica). Etiquetarla explícitamente como simulación.
5. **Cómo trabajamos** con cuatro etapas.
6. **Calculadora de impacto** interactiva: consultas/tareas por día, minutos por tarea, porcentaje automatizable, coste horario y CHF/EUR. Enseñar las fórmulas y dejar claro que es una estimación, no un ahorro garantizado ni ingresos adicionales reales.
7. **FAQ y formulario** para captar leads cualificados, con email, empresa, sector y problema. No simular envíos exitosos sin servidor de destino.
8. **Pie de página y navegación accesible**. No inventar testimonios, clientes, casos de éxito ni porcentajes de crecimiento.

## 4. Instrucciones técnicas

- Examina primero `src/App.jsx`, `src/styles.css`, `index.html`, `package.json` y los assets.
- Ejecuta `npm install`, `npm run dev` y `npm run build`. Si hay un error, arréglalo hasta que la web compile y funcione.
- Comprueba que todos los botones y secciones funcionan en escritorio y móvil, que los inputs permiten interacción, que la calculadora se actualiza y que no hay errores de consola.
- Revisa accesibilidad: contrastes, navegación con teclado, etiquetas de formularios, elementos semánticos, foco visible y opciones de movimiento reducido.
- Revisa SEO: títulos, descripción, Open Graph e imagen social real si es viable.
- Usa componentes reutilizables y mantén legible el código; no añadas dependencias innecesarias.
- Asegura que la portada cargue pronto y que no haya efectos que perjudiquen la lectura o el rendimiento.
- El formulario de contacto debe permitir integración segura con CRM/n8n, sin poner secretos en el navegador. Si no hay credenciales ni backend, conserva explícitamente el modo demostración y explica qué falta.
- Incluye instrucciones para desplegar en Vercel/Netlify, variables de entorno y un checklist antes del lanzamiento (privacidad, datos de empresa, dominio, consentimientos que sean necesarios).
- Mantén todo en español, con textos claros, concisos, persuasivos y sin promesas infundadas.

## 5. Entregables esperados de Claude Code

- Un sitio terminado y funcional, manteniendo la identidad visual cósmica.
- Un breve resumen de cambios y archivos editados.
- Confirmación de resultados de pruebas (`npm run build` y visualización local), sin fingir verificaciones.
- Lista corta de información que necesitamos aportar para publicarlo (email real, dominio, datos legales, casos reales si existen).

**Prioridad absoluta:** una web bonita que venda servicios reales de LIMITLESS, no un espectáculo espacial que distraiga o ralentice al visitante.
