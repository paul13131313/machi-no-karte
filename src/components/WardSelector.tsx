import type { WardEntry } from "../data/types";

interface WardSelectorProps {
  wards: WardEntry[];
  selectedCode: string;
  onChange: (code: string) => void;
}

export default function WardSelector({ wards, selectedCode, onChange }: WardSelectorProps) {
  return (
    <select
      className="ward-selector"
      value={selectedCode}
      onChange={(e) => onChange(e.target.value)}
    >
      {wards.map((w) => (
        <option key={w.city.code} value={w.city.code}>
          {w.city.name}
        </option>
      ))}
    </select>
  );
}
