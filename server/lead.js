// Lógica compartida del endpoint /api/lead (Vercel y Netlify).
// Se ejecuta en el servidor: aquí SÍ pueden usarse secretos (variables sin prefijo VITE_).
//
// Variables de entorno:
//   LEAD_FORWARD_URL     URL del webhook de n8n / CRM / Make que recibe el lead (obligatoria).
//   LEAD_FORWARD_SECRET  Secreto enviado en la cabecera X-Limitless-Secret (opcional, recomendado).
//   ALLOWED_ORIGIN       Origen permitido, p. ej. https://tudominio.com (opcional, recomendado).

const LIMITS = { name: 100, company: 120, email: 200, sector: 60, challenge: 80, message: 900, page: 300 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export async function handleLead(request, env = {}) {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const allowed = (env.ALLOWED_ORIGIN || '').trim();
  const origin = request.headers.get('origin') || '';
  if (allowed && origin && origin !== allowed) return json(403, { error: 'forbidden_origin' });

  const forwardUrl = (env.LEAD_FORWARD_URL || '').trim();
  if (!forwardUrl) return json(503, { error: 'lead_destination_not_configured' });

  const raw = await request.text();
  if (raw.length > 8000) return json(413, { error: 'payload_too_large' });

  let data;
  try { data = JSON.parse(raw); } catch { return json(400, { error: 'invalid_json' }); }
  if (data.website) return json(200, { ok: true }); // honeypot: se ignora en silencio

  const lead = Object.fromEntries(Object.entries(LIMITS).map(([k, max]) => [k, clean(data[k], max)]));
  if (!lead.name || !lead.company || !lead.sector || !EMAIL_RE.test(lead.email)) return json(422, { error: 'invalid_fields' });
  if (data.consent !== true) return json(422, { error: 'consent_required' });

  const headers = { 'Content-Type': 'application/json' };
  if (env.LEAD_FORWARD_SECRET) headers['X-Limitless-Secret'] = env.LEAD_FORWARD_SECRET;

  try {
    const res = await fetch(forwardUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...lead, consent: true, source: 'limitless-web', receivedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return json(502, { error: 'upstream_error' });
  } catch {
    return json(502, { error: 'upstream_unreachable' });
  }
  return json(200, { ok: true });
}
