import 'lenis/dist/lenis.css';
import './style.css';
import { initHero } from './hero.js';
import { initSections } from './sections.js';
import { initContact } from './contact.js';

document.getElementById('year').textContent = String(new Date().getFullYear());
initContact();
// Reveal-Animationen erst nach dem Hero einrichten, damit ScrollTrigger die
// endgültigen Positionen (600vh-Sequenz) misst.
initHero().then(initSections);
