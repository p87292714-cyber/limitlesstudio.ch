// Vercel Function: POST /api/lead
import { handleLead } from '../server/lead.js';

export function POST(request) {
  return handleLead(request, process.env);
}
