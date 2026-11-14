// Netlify Function: POST /api/lead
import { handleLead } from '../../server/lead.js';

export default (request) => handleLead(request, process.env);

export const config = { path: '/api/lead' };
