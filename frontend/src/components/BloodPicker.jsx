import { BLOOD_GROUPS, bloodLabel } from '../lib/bloods';

/** Single-select blood group chips. `allowAny` adds an "Any" chip that sets value to ''. */
export default function BloodPicker({ value, onChange, allowAny = false, disabled = false, only }) {
  const groups = only || BLOOD_GROUPS;
  return (
    <div className="chips" role="group" aria-label="Blood group">
      {allowAny && (
        <button type="button" className="chip" aria-pressed={!value} onClick={() => onChange('')} disabled={disabled}>Any</button>
      )}
      {groups.map((g) => (
        <button key={g} type="button" className="chip blood" aria-pressed={value === g} onClick={() => onChange(g)} disabled={disabled}>
          {bloodLabel(g)}
        </button>
      ))}
    </div>
  );
}
