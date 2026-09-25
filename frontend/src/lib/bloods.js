// Blood group helpers. Values match the backend enum (A_POS, O_NEG, ...).
export const BLOOD_GROUPS = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];

const LABELS = {
  A_POS: 'A+', A_NEG: 'A−', B_POS: 'B+', B_NEG: 'B−',
  AB_POS: 'AB+', AB_NEG: 'AB−', O_POS: 'O+', O_NEG: 'O−',
};

export const bloodLabel = (g) => LABELS[g] ?? g ?? '—';

// donor group -> recipient groups it can give to (mirror of backend DonationRules)
export const CAN_DONATE_TO = {
  O_NEG: [...BLOOD_GROUPS],
  O_POS: ['O_POS', 'A_POS', 'B_POS', 'AB_POS'],
  A_NEG: ['A_NEG', 'A_POS', 'AB_NEG', 'AB_POS'],
  A_POS: ['A_POS', 'AB_POS'],
  B_NEG: ['B_NEG', 'B_POS', 'AB_NEG', 'AB_POS'],
  B_POS: ['B_POS', 'AB_POS'],
  AB_NEG: ['AB_NEG', 'AB_POS'],
  AB_POS: ['AB_POS'],
};

export const donorsFor = (recipient) => BLOOD_GROUPS.filter((g) => CAN_DONATE_TO[g].includes(recipient));
export const canDonate = (donor, recipient) => !!donor && !!recipient && CAN_DONATE_TO[donor].includes(recipient);

export const URGENCY = [
  { value: 'LOW', label: 'Routine', hint: 'Needed within days' },
  { value: 'MEDIUM', label: 'Soon', hint: 'Needed within a day' },
  { value: 'HIGH', label: 'Urgent', hint: 'Needed within hours' },
  { value: 'CRITICAL', label: 'Critical', hint: 'Needed now' },
];
export const urgencyLabel = (u) => URGENCY.find((x) => x.value === u)?.label ?? u ?? '—';
export const urgencyTone = (u) => ({ LOW: 'ok', MEDIUM: 'warn', HIGH: 'warn', CRITICAL: 'primary' }[u] ?? 'muted');

// mirrors backend BloodRequestService transitions
export const STATUS_TRANSITIONS = {
  OPEN: ['MATCHING', 'FULFILLED', 'CANCELLED'],
  MATCHING: ['OPEN', 'FULFILLED', 'CANCELLED'],
  FULFILLED: [],
  CANCELLED: [],
};
export const statusLabel = (s) => ({ OPEN: 'Open', MATCHING: 'Donors notified', FULFILLED: 'Fulfilled', CANCELLED: 'Cancelled' }[s] ?? s ?? '—');
export const statusTone = (s) => ({ OPEN: 'warn', MATCHING: 'info', FULFILLED: 'ok', CANCELLED: 'muted' }[s] ?? 'muted');
export const isActiveStatus = (s) => s === 'OPEN' || s === 'MATCHING';
