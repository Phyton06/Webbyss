// Shared client store for the admin "Nueva cita" wizard (Fase 5).
// ponytail: localStorage only — swap for Supabase queries when the backend lands.

import { readAppointments, saveAppointments } from './appointments.js';

export const STORAGE_KEY = 'webbys_admin_clients';

// ponytail: 3 demo clients so the search box is never empty on a fresh install.
const DEMO_CLIENTS = [
  { name: 'Lucía Márquez', phone: '+54 9 11 5555-0012' },
  { name: 'Facundo Rivas', phone: '+54 9 11 5555-0013' },
  { name: 'Camila Ortega', phone: '+54 9 11 5555-0014' },
];

const genId = () =>
  typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now());

/** Raw read: never seeds. Empty array on missing/invalid data.
    Records written before the ban/notes fields exist are normalised here, so
    every caller sees one shape without touching the call sites. */
export function readClients() {
  let parsed;
  try {
    parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((client) => ({
    ...client,
    banned: Boolean(client.banned),
    bannedAt: client.bannedAt || '',
    notes: Array.isArray(client.notes) ? client.notes : [],
  }));
}

function saveClients(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Seed-on-first-write: unique (client, phone) pairs from the existing
    appointments + 3 demo clients. Only runs while the key is absent. */
export function seedClients() {
  if (localStorage.getItem(STORAGE_KEY) !== null) return readClients();

  const seen = new Set();
  const clients = [];
  const add = (name, phone) => {
    const key = `${name}\u0000${phone}`;
    if (seen.has(key)) return;
    seen.add(key);
    clients.push({ id: genId(), name, phone });
  };

  for (const appointment of readAppointments()) {
    if (appointment.client && appointment.phone) {
      add(appointment.client, appointment.phone);
    }
  }
  for (const demo of DEMO_CLIENTS) add(demo.name, demo.phone);

  saveClients(clients);
  return clients;
}

export function appendClient({ name, phone }) {
  if (localStorage.getItem(STORAGE_KEY) === null) seedClients();
  const client = { id: genId(), name, phone };
  const list = readClients();
  list.push(client);
  saveClients(list);
  return client;
}

// ─── Public registration (/Webbyss/registro, Fase 6) ───────────────
export const REGISTERED_STORAGE_KEY = 'webbys_registered_clients';

/** Raw read of completed public registrations. Empty array on bad data. */
export function readRegistered() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTERED_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Append one demo registration (nombre/tel from the share link + email). */
export function appendRegistered({ nombre, tel, email }) {
  const record = {
    id: genId(),
    nombre,
    tel,
    email,
    createdAt: new Date().toISOString(),
  };
  const list = readRegistered();
  list.push(record);
  localStorage.setItem(REGISTERED_STORAGE_KEY, JSON.stringify(list));
  return record;
}

/** Partial, case-insensitive match on name OR phone. Empty query → all. */
export function searchClients(query) {
  const needle = String(query || '').trim().toLowerCase();
  const list = readClients();
  if (needle === '') return list;
  return list.filter(
    (client) =>
      String(client.name).toLowerCase().includes(needle) ||
      String(client.phone).toLowerCase().includes(needle),
  );
}

// ─── Baneo + comentarios ─────────────────────────────────────────────
// ponytail: "pendiente" covers both not-yet-confirmed and confirmed future
// bookings; Atendido is history and is never rewritten by a ban.
const PENDING_STATUSES = ['Pendiente', 'Confirmada'];

/** Patch one client by id. Returns the saved record, or null when unknown. */
export function updateClient(id, patch) {
  const list = readClients();
  const index = list.findIndex((client) => client.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...patch };
  saveClients(list);
  return list[index];
}

/** Cancel every future booking this client still owes the shop.
    An appointment that carries a phone is matched on it; one without falls
    back to the name (the seed rows are the only ones like that). */
function cancelPendingFor(client) {
  const appointments = readAppointments();
  let changed = false;
  for (const appointment of appointments) {
    const matches = appointment.phone
      ? appointment.phone === client.phone
      : appointment.client === client.name;
    if (!matches || !PENDING_STATUSES.includes(appointment.status)) continue;
    appointment.status = 'Cancelado';
    changed = true;
  }
  if (changed) saveAppointments(appointments);
}

/** Ban a client: flag them AND cancel their outstanding bookings. */
export function banClient(id) {
  const client = updateClient(id, { banned: true, bannedAt: new Date().toISOString() });
  if (!client) return null;
  cancelPendingFor(client);
  return client;
}

/** Remove the ban. Already-cancelled bookings stay cancelled. */
export function unbanClient(id) {
  return updateClient(id, { banned: false, bannedAt: '' });
}

/** Append a comment to the profile. Empty/whitespace text is rejected. */
export function addNote(id, text) {
  const body = String(text || '').trim();
  if (body === '') return null;
  const client = readClients().find((entry) => entry.id === id);
  if (!client) return null;
  const note = { id: genId(), text: body, at: new Date().toISOString() };
  return updateClient(id, { notes: [...client.notes, note] });
}

/** Drop one comment. Unknown ids are a no-op, not an error. */
export function removeNote(id, noteId) {
  const client = readClients().find((entry) => entry.id === id);
  if (!client) return null;
  return updateClient(id, { notes: client.notes.filter((note) => note.id !== noteId) });
}
