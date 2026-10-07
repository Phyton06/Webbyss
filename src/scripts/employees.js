// Shared employee store for the admin "Personal" module.
// ponytail: localStorage only — swap for Supabase queries when the backend lands.

import { escapeHtml } from './appointments.js';

export { escapeHtml };

export const STORAGE_KEY = 'webbys_admin_employees';
export const ROLES = ['admin', 'barbero', 'asistente'];

/** Role → list section label, in render order. */
export const ROLE_LABEL = {
  admin: 'Administración',
  barbero: 'Barberos',
  asistente: 'Asistentes',
};

/** Short role names for the row/hero chips. */
export const ROLE_NAME = {
  admin: 'Admin',
  barbero: 'Barbero',
  asistente: 'Asistente',
};

/** Avatar background per role — existing tokens only (never a raw hex).
    White initials clear 4.5:1 against these three; olive
    --color-barber-miguel does not (3.9:1), which is why it is not used. */
export const ROLE_TOKEN = {
  admin: 'var(--color-gold-700)',
  barbero: 'var(--color-barber-carlos)',
  asistente: 'var(--color-barber-diego)',
};

// ponytail: 5 demo employees so the list is never empty on a fresh install.
// Phones reuse the +54 9 11 5555-00xx range from clients.js. The three
// barber first names are mandatory (appointments join on them).
const DEMO_EMPLOYEES = [
  {
    name: 'Sofía Bravo',
    phone: '+54 9 11 5555-0015',
    email: 'sofia@barbershop.com',
    role: 'admin',
    startDate: '2022-04-04',
    schedule: 'Lun a Vie · 9–18 h',
  },
  {
    name: 'Carlos Núñez',
    phone: '+54 9 11 5555-0016',
    email: 'carlos@barbershop.com',
    role: 'barbero',
    startDate: '2021-06-15',
    schedule: 'Mar a Sáb · 9–19 h',
  },
  {
    name: 'Diego Sosa',
    phone: '+54 9 11 5555-0017',
    email: 'diego@barbershop.com',
    role: 'barbero',
    startDate: '2022-02-10',
    schedule: 'Mar a Sáb · 9–19 h',
  },
  {
    name: 'Miguel Prieto',
    phone: '+54 9 11 5555-0018',
    email: 'miguel@barbershop.com',
    role: 'barbero',
    startDate: '2020-11-02',
    schedule: 'Mié a Dom · 10–19 h',
  },
  {
    name: 'Ana Ledesma',
    phone: '+54 9 11 5555-0019',
    email: 'ana@barbershop.com',
    role: 'asistente',
    startDate: '2024-01-08',
    schedule: 'Mar a Sáb · 9–19 h',
  },
];

const genId = () =>
  typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now());

/** Raw read: never seeds. Empty array on missing/invalid data. */
export function readEmployees() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEmployees(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Seed-on-first-write: 1 admin + 3 barberos + 1 asistente, only while the
    key is absent. `// ponytail: join on first name until Supabase gives both
    stores real ids`. */
export function seedEmployees() {
  if (localStorage.getItem(STORAGE_KEY) !== null) return readEmployees();

  const seeded = DEMO_EMPLOYEES.map((employee) => ({
    id: genId(),
    status: 'Activo',
    ...employee,
  }));
  saveEmployees(seeded);
  return seeded;
}

/** Create one employee (always Activo). Seeds first so a fresh browser
    never stores a single orphan record. */
export function appendEmployee(data) {
  if (localStorage.getItem(STORAGE_KEY) === null) seedEmployees();

  const employee = {
    id: genId(),
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    role: ROLES.includes(data.role) ? data.role : 'barbero',
    status: 'Activo',
    startDate: data.startDate || '',
    schedule: data.schedule || '',
  };
  const list = readEmployees();
  list.push(employee);
  saveEmployees(list);
  return employee;
}

/** Patch one employee by id. The id can never be moved by a patch. */
export function updateEmployee(id, patch) {
  const list = readEmployees();
  const index = list.findIndex((employee) => employee.id === id);
  if (index === -1) return null;

  list[index] = { ...list[index], ...patch, id };
  saveEmployees(list);
  return list[index];
}

/** Deactivate (never hard-delete): status → 'Baja', record stays. */
export function deactivateEmployee(id) {
  return updateEmployee(id, { status: 'Baja' });
}

export function getEmployee(id) {
  return readEmployees().find((employee) => employee.id === id) || null;
}

/** Partial, case-insensitive match on name OR phone. Empty query → all. */
export function searchEmployees(query) {
  const needle = String(query || '').trim().toLowerCase();
  const list = readEmployees();
  if (needle === '') return list;
  return list.filter(
    (employee) =>
      String(employee.name).toLowerCase().includes(needle) ||
      String(employee.phone).toLowerCase().includes(needle),
  );
}
