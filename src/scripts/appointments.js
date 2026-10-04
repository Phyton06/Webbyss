// Shared appointment store for the admin screens (home, agenda, nueva cita).
// ponytail: localStorage only — swap for Supabase queries when the backend lands.

export const STORAGE_KEY = 'webbys_admin_appointments';
export const BARBERS = ['Carlos', 'Diego', 'Miguel'];
export const SERVICES = ['Corte', 'Corte + Barba', 'Barba', 'Cejas'];
export const STATUSES = ['Pendiente', 'Confirmada', 'Atendido', 'Cancelado'];
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 19;

export const BARBER_TOKEN = {
  Carlos: 'var(--color-barber-carlos)',
  Diego: 'var(--color-barber-diego)',
  Miguel: 'var(--color-barber-miguel)',
};

const pad = (n) => String(n).padStart(2, '0');

export const dayKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayKey = () => dayKey(new Date());

export const hhmm = (date = new Date()) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// "YYYY-MM-DD" → local Date (new Date(string) would parse as UTC and shift days).
export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// ponytail: demo seed appointments — relative Date math so every run is a
// repeatable demo. Revision 4 delta 3: every barber has upcoming citas
// (tomorrow/+2 are always in the future), the three barbers overlap at the
// same slot tomorrow, several days are populated and all four statuses appear.
const seed = (now = new Date()) => {
  const dayOffset = (days) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    return dayKey(d);
  };
  const today = dayOffset(0);
  const tomorrow = dayOffset(1);
  const dayAfter = dayOffset(2);

  return [
    {
      id: 'seed-1',
      date: today,
      time: '10:00',
      client: 'Martín López',
      phone: '+54 9 11 5555-0001',
      service: 'Corte',
      barber: 'Carlos',
      status: 'Atendido',
    },
    {
      id: 'seed-2',
      date: today,
      time: '11:30',
      client: 'Julián Ferreyra',
      phone: '+54 9 11 5555-0002',
      service: 'Corte + Barba',
      barber: 'Diego',
      status: 'Cancelado',
    },
    {
      id: 'seed-3',
      date: today,
      time: '12:30',
      client: 'Rodrigo Sánchez',
      phone: '+54 9 11 5555-0003',
      service: 'Barba',
      barber: 'Miguel',
      status: 'Confirmada',
    },
    {
      id: 'seed-4',
      date: tomorrow,
      time: '09:30',
      client: 'Agustín Ramos',
      phone: '+54 9 11 5555-0004',
      service: 'Cejas',
      barber: 'Carlos',
      status: 'Confirmada',
    },
    // Same-time overlap: the three barbers at 16:00 tomorrow (parallel citas).
    {
      id: 'seed-5',
      date: tomorrow,
      time: '16:00',
      client: 'Ezequiel Duarte',
      phone: '+54 9 11 5555-0005',
      service: 'Corte',
      barber: 'Carlos',
      status: 'Pendiente',
    },
    {
      id: 'seed-6',
      date: tomorrow,
      time: '16:00',
      client: 'Facundo Herrera',
      phone: '+54 9 11 5555-0006',
      service: 'Corte + Barba',
      barber: 'Diego',
      status: 'Confirmada',
    },
    {
      id: 'seed-7',
      date: tomorrow,
      time: '16:00',
      client: 'Tomás Cabrera',
      phone: '+54 9 11 5555-0007',
      service: 'Barba',
      barber: 'Miguel',
      status: 'Pendiente',
    },
    {
      id: 'seed-8',
      date: tomorrow,
      time: '18:00',
      client: 'Bruno Salas',
      phone: '+54 9 11 5555-0008',
      service: 'Corte',
      barber: 'Diego',
      status: 'Pendiente',
    },
    {
      id: 'seed-9',
      date: dayAfter,
      time: '11:00',
      client: 'Iván Peralta',
      phone: '+54 9 11 5555-0009',
      service: 'Corte + Barba',
      barber: 'Carlos',
      status: 'Pendiente',
    },
    {
      id: 'seed-10',
      date: dayAfter,
      time: '17:00',
      client: 'Nicolás Vega',
      phone: '+54 9 11 5555-0010',
      service: 'Cejas',
      barber: 'Miguel',
      status: 'Confirmada',
    },
    {
      id: 'seed-11',
      date: dayAfter,
      time: '18:30',
      client: 'Santiago Ríos',
      phone: '+54 9 11 5555-0011',
      service: 'Barba',
      barber: 'Diego',
      status: 'Cancelado',
    },
  ];
};

/** Raw read: never seeds. Empty array on missing/invalid data. */
export function readAppointments() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Seed-on-first-read: writes the mock appointments when the key is absent. */
export function loadAppointments() {
  if (localStorage.getItem(STORAGE_KEY) === null) {
    const seeded = seed(new Date());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return readAppointments();
}

export function saveAppointments(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function appendAppointment(appointment) {
  const list = readAppointments();
  list.push(appointment);
  saveAppointments(list);
}

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

export const statusClass = (status) =>
  ({
    Confirmada: 'is-confirmed',
    Pendiente: 'is-pending',
    Atendido: 'is-done',
    Cancelado: 'is-cancelled',
  })[status] || 'is-pending';
