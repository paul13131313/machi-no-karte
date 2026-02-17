import type { PopulationData } from "../data/types";

interface PopulationSummaryProps {
  population: PopulationData;
}

export default function PopulationSummary({ population }: PopulationSummaryProps) {
  const ageData = [
    {
      label: "〜14歳",
      pct: ((population.under15 / population.total) * 100).toFixed(1),
      color: "#555",
    },
    {
      label: "15〜64歳",
      pct: ((population.age15to64 / population.total) * 100).toFixed(1),
      color: "#1a1a1a",
    },
    {
      label: "65歳〜",
      pct: ((population.over65 / population.total) * 100).toFixed(1),
      color: "#aaa",
    },
  ];

  return (
    <div className="pop-inner">
      <h2 className="section-title">人口</h2>
      <div className="pop-content">
        <div className="pop-total">
          <span className="pop-total-number">
            {population.total.toLocaleString()}
          </span>
          <span className="pop-total-unit">人</span>
        </div>
        <div className="pop-gender">
          <span>男 {population.male.toLocaleString()}</span>
          <span>女 {population.female.toLocaleString()}</span>
        </div>
        <div className="age-bar">
          {ageData.map((d) => (
            <div
              key={d.label}
              className="age-segment"
              style={{ width: `${d.pct}%`, backgroundColor: d.color }}
            />
          ))}
        </div>
        <div className="age-legend">
          {ageData.map((d) => (
            <div key={d.label} className="age-legend-item">
              <span className="age-dot" style={{ backgroundColor: d.color }} />
              <span className="age-label">{d.label}</span>
              <span className="age-pct">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
