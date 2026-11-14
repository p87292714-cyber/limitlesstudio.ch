/* Ergänzungen von LIMITLESS über dem Prototyp «Reise» (public/js/*.js):
   Kontaktformular, Kontaktdaten aus Umgebungsvariablen, Barrierefreiheit. */
import './form.css';
import { initContact } from './contact.js';
import { initEnhance } from './enhance.js';

document.getElementById('year').textContent = String(new Date().getFullYear());
initContact();
initEnhance();
