/* Kontaktformular und Kontaktdaten aus Umgebungsvariablen.
   Ohne konfiguriertes Ziel bleibt das Formular im Demo-Modus und sendet nichts. */

const env = import.meta.env;
const val = (k) => (env[k] || '').trim();

const LEAD_ENDPOINT = val('VITE_LEAD_ENDPOINT');
const CONTACT_EMAIL = val('VITE_CONTACT_EMAIL');
const CONTACT_PHONE = val('VITE_CONTACT_PHONE');
const WHATSAPP_URL = val('VITE_WHATSAPP_URL');
const BOOKING_URL = val('VITE_BOOKING_URL');
// Eigene rechtliche Seiten (impressum.html, datenschutz.html); per Umgebungsvariable überschreibbar
const PRIVACY_URL = val('VITE_PRIVACY_URL') || '/datenschutz.html';
const LEGAL_URL = val('VITE_LEGAL_URL') || '/impressum.html';

function setLink(id, href) {
  const el = document.getElementById(id);
  if (!el) return;
  if (href) el.href = href; else el.hidden = true;
}

export function initContact() {
  // Buchungslink, Impressum, Datenschutz: nur anzeigen, wenn konfiguriert.
  setLink('cta-booking', BOOKING_URL);
  setLink('link-legal', LEGAL_URL);
  setLink('link-privacy', PRIVACY_URL);
  const privacyInline = document.getElementById('consent-privacy');
  if (privacyInline) {
    if (PRIVACY_URL) privacyInline.querySelector('a').href = PRIVACY_URL; else privacyInline.hidden = true;
  }

  const details = document.getElementById('contact-details');
  const items = [
    CONTACT_EMAIL && `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`,
    CONTACT_PHONE && `<a href="tel:${CONTACT_PHONE.replace(/[^+\d]/g, '')}">${CONTACT_PHONE}</a>`,
    WHATSAPP_URL && `<a href="${WHATSAPP_URL}" target="_blank" rel="noopener">WhatsApp</a>`,
  ].filter(Boolean);
  if (details) {
    if (items.length) details.innerHTML = items.join('<span aria-hidden="true"> · </span>'); else details.hidden = true;
  }

  const form = document.getElementById('lead-form');
  const status = document.getElementById('form-status');
  const submit = form.querySelector('button[type=submit]');
  const mode = LEAD_ENDPOINT ? 'endpoint' : CONTACT_EMAIL ? 'email' : 'demo';
  if (mode !== 'demo') document.getElementById('demo-banner').hidden = true;

  const show = (type, text) => {
    status.hidden = false;
    status.className = `form-status is-${type}`;
    status.setAttribute('role', type === 'error' ? 'alert' : 'status');
    status.textContent = text;
  };

  form.addEventListener('input', () => { status.hidden = true; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // Honeypot
    const payload = {
      name: data.name.trim(), company: data.company.trim(), email: data.email.trim(),
      sector: data.sector, message: (data.message || '').trim(), consent: data.consent === 'on',
      page: location.href, submittedAt: new Date().toISOString(),
    };

    if (mode === 'endpoint') {
      submit.disabled = true;
      submit.textContent = 'Wird gesendet …';
      try {
        const res = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        show('ok', 'Danke! Ihre Anfrage ist bei uns. Wir melden uns innert 48 Stunden per E-Mail.');
      } catch {
        show('error', 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es in ein paar Minuten erneut.');
      } finally {
        submit.disabled = false;
        submit.textContent = 'Digital-Check anfordern';
      }
    } else if (mode === 'email') {
      const body = [`Name: ${payload.name}`, `Betrieb: ${payload.company}`, `E-Mail: ${payload.email}`,
        `Branche: ${payload.sector}`, `Nachricht: ${payload.message || '–'}`].join('\n');
      location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Digital-Check – ${payload.company}`)}&body=${encodeURIComponent(body)}`;
      show('info', 'Ihr E-Mail-Programm wurde mit der Anfrage geöffnet. Bitte senden Sie die E-Mail dort ab.');
    } else {
      show('info', 'Demo-Modus: Das Formular ist korrekt ausgefüllt, die Anfrage wurde aber NICHT gesendet, weil noch kein Ziel konfiguriert ist.');
    }
  });
}
