import type { WardEntry, Scores, CategoryData } from "../data/types";

// 人口あたりに変換不要な単位
const NO_CONVERSION_UNITS = ["万円", "%", ""];

// 人口1万人あたりに変換
function toPerCapita(value: number, population: number): number {
  return (value / population) * 10000;
}

// カテゴリの人口あたり平均値を計算
function getCategoryPerCapitaAvg(
  category: CategoryData,
  population: number
): number {
  let total = 0;
  let count = 0;

  for (const item of category.items) {
    const needsConversion = !NO_CONVERSION_UNITS.includes(item.unit);
    const value = needsConversion ? toPerCapita(item.value, population) : item.value;
    total += value;
    count++;
  }

  return count > 0 ? total / count : 0;
}

// デフォルトスコア（23区平均 = 50）
const DEFAULT_SCORES: Scores = {
  childcare: 50,
  medical: 50,
  safety: 50,
  economy: 50,
  education: 50,
  living: 50,
};

// 全区のデータから人口あたりスコアを計算
// スコア計算式: 50 × (自治体の人口あたり値 / 23区平均の人口あたり値)
// 安全カテゴリは逆転（少ないほど高スコア）
// 上限100にクリップ
export function calcPerCapitaScores(
  wards: WardEntry[],
  targetCode: string
): { scores: Scores; avg23Scores: Scores } {
  // wardsが空の場合はデフォルト値を返す
  if (!wards || wards.length === 0) {
    return { scores: DEFAULT_SCORES, avg23Scores: DEFAULT_SCORES };
  }

  const categories: (keyof Scores)[] = [
    "childcare",
    "medical",
    "safety",
    "economy",
    "education",
    "living",
  ];

  // 安全カテゴリ（低いほど良い）
  const invertCategories: (keyof Scores)[] = ["safety"];

  // 各区の各カテゴリの人口あたり値を計算
  const wardValues: Record<string, Record<keyof Scores, number>> = {};

  for (const ward of wards) {
    const pop = ward.city.population.total;
    wardValues[ward.city.code] = {
      childcare: getCategoryPerCapitaAvg(ward.city.childcare, pop),
      medical: getCategoryPerCapitaAvg(ward.city.medical, pop),
      safety: getCategoryPerCapitaAvg(ward.city.safety, pop),
      economy: getCategoryPerCapitaAvg(ward.city.economy, pop),
      education: getCategoryPerCapitaAvg(ward.city.education, pop),
      living: getCategoryPerCapitaAvg(ward.city.living, pop),
    };
  }

  // 各カテゴリの23区平均を計算
  const avg23Values: Record<keyof Scores, number> = {} as Record<keyof Scores, number>;
  for (const cat of categories) {
    const values = Object.values(wardValues).map((v) => v[cat]);
    avg23Values[cat] = values.reduce((a, b) => a + b, 0) / values.length;
  }

  // ターゲット区のスコアを計算
  const targetValues = wardValues[targetCode];
  if (!targetValues) {
    return { scores: DEFAULT_SCORES, avg23Scores: DEFAULT_SCORES };
  }

  const scores: Scores = {} as Scores;
  for (const cat of categories) {
    const avg = avg23Values[cat];
    if (avg === 0) {
      scores[cat] = 50;
      continue;
    }

    let score: number;
    if (invertCategories.includes(cat)) {
      // 安全カテゴリ: 少ないほど高スコア → 逆数で計算
      score = 50 * (avg / targetValues[cat]);
    } else {
      // 通常: 多いほど高スコア
      score = 50 * (targetValues[cat] / avg);
    }

    // 上限100にクリップ
    scores[cat] = Math.round(Math.min(100, Math.max(0, score)));
  }

  // 23区平均スコアは常に50
  const avg23Scores: Scores = {
    childcare: 50,
    medical: 50,
    safety: 50,
    economy: 50,
    education: 50,
    living: 50,
  };

  return { scores, avg23Scores };
}
