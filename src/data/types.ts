// 自治体データの型定義

export interface CityData {
  code: string;
  name: string;
  population: PopulationData;
  childcare: CategoryData;
  medical: CategoryData;
  safety: CategoryData;
  economy: CategoryData;
  education: CategoryData;
  living: CategoryData;
}

export interface PopulationData {
  total: number;
  male: number;
  female: number;
  under15: number;
  age15to64: number;
  over65: number;
  foreigners: number;
  trend: { year: number; population: number }[];
}

export interface StatItem {
  label: string;
  value: number;
  unit: string;
  description?: string;
  avg23: number;
}

export interface CategoryData {
  emoji: string;
  label: string;
  color: string;
  items: StatItem[];
}

// レーダーチャート用スコア
export interface Scores {
  childcare: number;
  medical: number;
  safety: number;
  economy: number;
  education: number;
  living: number;
}

// ランキング情報（23区中の順位）
export interface Rankings {
  population: number;
  childcare: number;
  medical: number;
  safety: number;
  economy: number;
  education: number;
  living: number;
}

// 全区データの構造（wards.json の型）
export interface WardEntry {
  city: CityData;
  scores: Scores;
  rankings: Rankings;
}

export interface WardsData {
  generatedAt: string;
  avg23Scores: Scores;
  wards: WardEntry[];
}
