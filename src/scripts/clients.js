// Shared client store for the admin "Nueva cita" wizard (Fase 5).
// ponytail: localStorage only — swap for Supabase queries when the backend lands.

import { readAppointments } from './appointments.js';

export const STORAGE_KEY = 'webbys_admin_clients';

// ponytail: 3 demo clients so the search box is never empty on a fresh install.
const DEMO_CLIENTS = [
  { name: 'Lucía Márquez', phone: '+54 9 11 5555-0012' },
  { name: 'Facundo Rivas', phone: '+54 9 11 5555-0013' },
  { name: 'Camila Ortega', phone: '+54 9 11 5555-0014' },
];

const genId = () =>
  typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now());

/** Raw read: never seeds. Empty array on missing/invalid data. */
export function readClients() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
