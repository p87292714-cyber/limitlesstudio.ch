import './fonts.css';
import './legal.css';

const y = document.getElementById('year');
if (y) y.textContent = String(new Date().getFullYear());
