import type { CategoryData } from "../data/types";

interface StatCardProps {
  category: CategoryData;
  population: number;
  avg23Population: number;
}

// 人口あたりに変換不要な単位
const NO_CONVERSION_UNITS = ["万円", "%", ""];

// 人口1万人あたりに変換
function toPerCapita(value: number, population: number): number {
  return (value / population) * 10000;
}

// 数値フォーマット（実数表示）
function formatValue(value: number): string {
  if (value >= 10000) {
    return value.toLocaleString();
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toFixed(1);
}

// 人口あたりベースで差分%を計算
function calcPerCapitaDiff(
  value: number,
  avg23: number,
  population: number,
  avg23Population: number,
  needsConversion: boolean
): { diff: number; isPositive: boolean } {
  let myPerCapita: number;
  let avgPerCapita: number;

  if (needsConversion) {
    myPerCapita = toPerCapita(value, population);
    avgPerCapita = toPerCapita(avg23, avg23Population);
  } else {
    myPerCapita = value;
    avgPerCapita = avg23;
  }

  if (avgPerCapita === 0) {
    return { diff: 0, isPositive: true };
  }

  const diff = ((myPerCapita - avgPerCapita) / avgPerCapita) * 100;
  return { diff: Math.abs(diff), isPositive: diff >= 0 };
}

export default function StatCard({ category, population, avg23Population }: StatCardProps) {
  // 最大3つまで表示
  const displayItems = category.items.slice(0, 3);

  return (
    <div className="stat-inner">
      <div className="stat-card-header">
        <h3 className="stat-card-title">
          {category.label}
        </h3>
      </div>
      <div className="stat-items">
        {displayItems.map((item) => {
          const needsConversion = !NO_CONVERSION_UNITS.includes(item.unit);

          // 人口あたりベースで比較%を計算
          const { diff, isPositive } = calcPerCapitaDiff(
            item.value,
            item.avg23,
            population,
            avg23Population,
            needsConversion
          );

          const safetyInvert =
            category.label === "安全" &&
            (item.label.includes("犯") ||
              item.label.includes("事故") ||
              item.label.includes("火災"));
          const isGood = safetyInvert ? !isPositive : isPositive;

          return (
            <div key={item.label} className="stat-item">
              <div className="stat-label">{item.label}</div>
              <div className="stat-value-row">
                <span className="stat-value">
                  {formatValue(item.value)}
                  <span className="stat-unit">{item.unit}</span>
                </span>
                <span className={`stat-diff ${isGood ? "good" : "bad"}`}>
                  {isPositive ? "+" : "-"}{diff.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
