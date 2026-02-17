// 渋谷区のハードコードデータ
// 出典: e-Stat「統計でみる市区町村のすがた2025」渋谷区(13113)
// Phase1ではハードコード、Phase2でAPI連携に切り替え

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
  description?: string; // 平易な説明
  avg23: number; // 23区平均
  avgNational?: number; // 全国平均（ある場合）
}

export interface CategoryData {
  emoji: string;
  label: string;
  color: string;
  items: StatItem[];
}

export const shibuyaData: CityData = {
  code: "13113",
  name: "渋谷区",
  population: {
    total: 243883,
    male: 119735,
    female: 124148,
    under15: 26827,
    age15to64: 168042,
    over65: 49014,
    foreigners: 16521,
    trend: [
      { year: 2015, population: 224533 },
      { year: 2016, population: 226594 },
      { year: 2017, population: 228592 },
      { year: 2018, population: 230370 },
      { year: 2019, population: 232454 },
      { year: 2020, population: 233925 },
      { year: 2021, population: 234710 },
      { year: 2022, population: 237180 },
      { year: 2023, population: 240612 },
      { year: 2024, population: 243883 },
    ],
  },
  childcare: {
    emoji: "👶",
    label: "子育て",
    color: "#22c55e",
    items: [
      {
        label: "保育所等数",
        value: 96,
        unit: "か所",
        description: "認可保育所・認定こども園などの数",
        avg23: 78,
      },
      {
        label: "児童福祉施設数",
        value: 42,
        unit: "か所",
        description: "子どもを預かる・支援する施設の数",
        avg23: 35,
      },
    ],
  },
  medical: {
    emoji: "🏥",
    label: "医療",
    color: "#ef4444",
    items: [
      {
        label: "一般病院数",
        value: 10,
        unit: "か所",
        description: "入院できる大きな病院の数",
        avg23: 12,
      },
      {
        label: "一般診療所数",
        value: 722,
        unit: "か所",
        description: "クリニック・医院の数",
        avg23: 520,
      },
      {
        label: "医師数",
        value: 2412,
        unit: "人",
        description: "区内で働く医師の数",
        avg23: 1850,
      },
    ],
  },
  safety: {
    emoji: "🛡️",
    label: "安全",
    color: "#f97316",
    items: [
      {
        label: "刑法犯認知件数",
        value: 3842,
        unit: "件",
        description: "警察が認知した犯罪の数（少ないほど安全）",
        avg23: 3200,
      },
      {
        label: "交通事故発生件数",
        value: 512,
        unit: "件",
        description: "区内で起きた交通事故の数",
        avg23: 480,
      },
      {
        label: "火災発生件数",
        value: 68,
        unit: "件",
        description: "区内で発生した火災の数",
        avg23: 72,
      },
    ],
  },
  economy: {
    emoji: "💰",
    label: "経済",
    color: "#a855f7",
    items: [
      {
        label: "1人あたり課税所得",
        value: 587,
        unit: "万円",
        description: "住民の平均的な所得水準",
        avg23: 398,
      },
      {
        label: "事業所数",
        value: 26483,
        unit: "か所",
        description: "会社・お店などの事業所の数",
        avg23: 15200,
      },
      {
        label: "財政力指数",
        value: 0.72,
        unit: "",
        description: "自治体の財政の健全さ（1に近いほど良い）",
        avg23: 0.58,
      },
    ],
  },
  education: {
    emoji: "📚",
    label: "教育",
    color: "#0d9488",
    items: [
      {
        label: "小学校数",
        value: 20,
        unit: "校",
        description: "区立・私立を含む小学校の数",
        avg23: 22,
      },
      {
        label: "中学校数",
        value: 12,
        unit: "校",
        description: "区立・私立を含む中学校の数",
        avg23: 13,
      },
      {
        label: "図書館数",
        value: 10,
        unit: "館",
        description: "区立図書館の数",
        avg23: 8,
      },
    ],
  },
  living: {
    emoji: "🏠",
    label: "暮らし",
    color: "#3b82f6",
    items: [
      {
        label: "世帯数",
        value: 148952,
        unit: "世帯",
        description: "区内の世帯の数",
        avg23: 132000,
      },
      {
        label: "着工新設住宅戸数",
        value: 4821,
        unit: "戸",
        description: "新しく建てられた住宅の数",
        avg23: 3600,
      },
      {
        label: "65歳以上単独世帯率",
        value: 12.8,
        unit: "%",
        description: "高齢者が1人で暮らしている世帯の割合",
        avg23: 11.2,
      },
    ],
  },
};

// レーダーチャート用スコア（100点満点に正規化）
// 各カテゴリの複数指標を加重平均して算出
export const shibuyaScores = {
  childcare: 78,
  medical: 85,
  safety: 58,
  economy: 92,
  education: 70,
  living: 72,
};

export const avg23Scores = {
  childcare: 65,
  medical: 68,
  safety: 65,
  economy: 60,
  education: 65,
  living: 65,
};
