export function timeAgo(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const fmtKm = (km) => (km == null || Number.isNaN(Number(km)) ? '—' : `${Number(km).toFixed(1)} km`);

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

const pad = (n) => String(n).padStart(2, '0');

/** yyyy-MM-dd for <input type="date"> */
export function toDateInput(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** yyyy-MM-ddTHH:mm for <input type="datetime-local"> */
export function toDateTimeInput(d = new Date()) {
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Backend expects LocalDateTime (no zone): yyyy-MM-ddTHH:mm:ss */
export function toLocalDateTime(inputValue) {
  if (!inputValue) return undefined;
  return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}

/** A calendar date -> LocalDateTime. Today uses "a minute ago" so the server never sees the future. */
export function dateToDonationDateTime(dateStr) {
  const now = new Date();
  if (dateStr === toDateInput(now)) {
    const past = new Date(now.getTime() - 60000);
    return `${dateStr}T${pad(past.getHours())}:${pad(past.getMinutes())}:00`;
  }
  return `${dateStr}T12:00:00`;
}

export function daysBetween(a, b = new Date()) {
  return Math.floor((new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0)) / 86400000);
}
