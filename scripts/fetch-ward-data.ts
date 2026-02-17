/**
 * ビルド時に e-Stat API を叩いて東京23区のデータを取得し、
 * public/data/wards.json を生成するスクリプト
 *
 * 実行: npx tsx scripts/fetch-ward-data.ts
 */

import fs from "node:fs";
import path from "node:path";

// ── 設定 ──

const APP_ID = process.env.VITE_ESTAT_APP_ID;
if (!APP_ID) {
  // APIキーがない場合、既にデータファイルがあればスキップ（CI用）
  const dataPath = path.resolve(import.meta.dirname ?? ".", "../public/data/wards.json");
  if (fs.existsSync(dataPath)) {
    console.log("VITE_ESTAT_APP_ID 未設定。既存の wards.json を使用します。");
    process.exit(0);
  }
  console.error("VITE_ESTAT_APP_ID が .env.local に設定されていません");
  process.exit(1);
}

const API_BASE = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";

// 東京23区のコード（13101〜13123）
const WARD_CODES = Array.from({ length: 23 }, (_, i) =>
  String(13101 + i)
);

const WARD_NAMES: Record<string, string> = {
  "13101": "千代田区", "13102": "中央区", "13103": "港区",
  "13104": "新宿区", "13105": "文京区", "13106": "台東区",
  "13107": "墨田区", "13108": "江東区", "13109": "品川区",
  "13110": "目黒区", "13111": "大田区", "13112": "世田谷区",
  "13113": "渋谷区", "13114": "中野区", "13115": "杉並区",
  "13116": "豊島区", "13117": "北区", "13118": "荒川区",
  "13119": "板橋区", "13120": "練馬区", "13121": "足立区",
  "13122": "葛飾区", "13123": "江戸川区",
};

// ── 取得する指標の定義 ──

interface IndicatorDef {
  tableId: string;
  code: string;
}

// 各テーブルからの取得指標
const INDICATORS: Record<string, IndicatorDef> = {
  // 人口（テーブル: 0000020201）
  totalPop:     { tableId: "0000020201", code: "A1101" },
  malePop:      { tableId: "0000020201", code: "A110101" },
  femalePop:    { tableId: "0000020201", code: "A110102" },
  under15:      { tableId: "0000020201", code: "A1301" },
  age15to64:    { tableId: "0000020201", code: "A1302" },
  over65:       { tableId: "0000020201", code: "A1303" },
  foreigners:   { tableId: "0000020201", code: "A1700" },
  households:   { tableId: "0000020201", code: "A7101" },
  elderSingle:  { tableId: "0000020201", code: "A8301" },

  // 経済（テーブル: 0000020203）
  taxIncome:    { tableId: "0000020203", code: "C120110" },
  taxpayers:    { tableId: "0000020203", code: "C120120" },
  businesses:   { tableId: "0000020203", code: "C2107" },

  // 行政（テーブル: 0000020204）- 歳入決算総額（特別区でも取得可能）
  revenue:      { tableId: "0000020204", code: "D3201" },

  // 教育（テーブル: 0000020205）
  elemSchools:  { tableId: "0000020205", code: "E2101" },
  midSchools:   { tableId: "0000020205", code: "E3101" },

  // 文化（テーブル: 0000020207）
  libraries:    { tableId: "0000020207", code: "G1401" },

  // 居住（テーブル: 0000020208）
  newHousing:   { tableId: "0000020208", code: "H1800" },

  // 医療（テーブル: 0000020209）
  hospitals:    { tableId: "0000020209", code: "I510120" },
  clinics:      { tableId: "0000020209", code: "I5102" },
  doctors:      { tableId: "0000020209", code: "I6100" },

  // 福祉（テーブル: 0000020210）
  nurseries:    { tableId: "0000020210", code: "J2503" },
  childWelfare: { tableId: "0000020210", code: "J2501" },

  // 安全（テーブル: 0000020211）
  trafficAcc:   { tableId: "0000020211", code: "K3101" },
  crimes:       { tableId: "0000020211", code: "K4201" },
};

// 人口トレンド: 国勢調査は5年ごと（1980, 1985, ..., 2020）
// 2000年以降のデータを使用
const TREND_MIN_YEAR = 2000;

// ── API呼び出し ──

interface EStatValue {
  "@tab": string;
  "@cat01": string;
  "@area": string;
  "@time": string;
  "@unit"?: string;
  "$": string;
}

async function fetchEStatData(
  tableId: string,
  codes: string[],
  areas: string[]
): Promise<EStatValue[]> {
  const params = new URLSearchParams({
    appId: APP_ID!,
    statsDataId: tableId,
    cdArea: areas.join(","),
    cdCat01: codes.join(","),
  });

  const url = `${API_BASE}?${params}`;
  console.log(`  fetch: table=${tableId} codes=${codes.join(",")} ...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const statData = json.GET_STATS_DATA?.STATISTICAL_DATA;
  if (!statData?.DATA_INF?.VALUE) {
    console.warn(`  警告: データなし (table=${tableId}, codes=${codes.join(",")})`);
    return [];
  }

  const values = statData.DATA_INF.VALUE;
  return Array.isArray(values) ? values : [values];
}

// テーブルごとにまとめてリクエスト（APIコール数を減らす）
async function fetchAllIndicators(): Promise<Map<string, Map<string, number>>> {
  // テーブルID → コードのグループ化
  const tableGroups = new Map<string, string[]>();
  for (const [, def] of Object.entries(INDICATORS)) {
    const existing = tableGroups.get(def.tableId) || [];
    if (!existing.includes(def.code)) {
      existing.push(def.code);
    }
    tableGroups.set(def.tableId, existing);
  }

  // 結果: "areaCode:indicatorCode" → value
  const result = new Map<string, Map<string, number>>();

  for (const [tableId, codes] of tableGroups) {
    // APIのレート制限を考慮して少し待つ
    await sleep(500);

    const values = await fetchEStatData(tableId, codes, WARD_CODES);

    for (const v of values) {
      const area = v["@area"];
      const code = v["@cat01"];
      const time = v["@time"];
      const year = parseInt(time.substring(0, 4));
      const val = parseFloat(v["$"]);

      if (isNaN(val)) continue;

      // 最新年のデータを使う
      if (!result.has(area)) {
        result.set(area, new Map());
      }
      const areaMap = result.get(area)!;

      // 既存データがあれば、より新しい年のデータで上書き
      const existingKey = `${code}_year`;
      const existingYear = areaMap.get(existingKey) || 0;
      if (year >= existingYear) {
        areaMap.set(code, val);
        areaMap.set(existingKey, year);
      }
    }
  }

  return result;
}

// 人口トレンドデータを取得
async function fetchPopulationTrend(): Promise<Map<string, { year: number; population: number }[]>> {
  const result = new Map<string, { year: number; population: number }[]>();

  await sleep(500);
  const values = await fetchEStatData("0000020201", ["A1101"], WARD_CODES);

  // 区ごとにグループ化
  const byArea = new Map<string, { year: number; pop: number }[]>();
  for (const v of values) {
    const area = v["@area"];
    const year = parseInt(v["@time"].substring(0, 4));
    const pop = parseInt(v["$"]);

    if (isNaN(pop)) continue;
    if (year < TREND_MIN_YEAR) continue;

    if (!byArea.has(area)) {
      byArea.set(area, []);
    }
    byArea.get(area)!.push({ year, pop });
  }

  for (const [area, data] of byArea) {
    data.sort((a, b) => a.year - b.year);
    result.set(
      area,
      data.map((d) => ({ year: d.year, population: d.pop }))
    );
  }

  return result;
}

// ── データ変換 ──

function getValue(areaMap: Map<string, number>, code: string): number {
  return areaMap.get(code) ?? 0;
}

function calcAvg23(allData: Map<string, Map<string, number>>, code: string): number {
  let sum = 0;
  let count = 0;
  for (const [, areaMap] of allData) {
    const val = areaMap.get(code);
    if (val !== undefined) {
      sum += val;
      count++;
    }
  }
  return count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
}

// スコア計算（偏差値ベース、50を基準に0-100でクランプ）
function calcScores(
  allData: Map<string, Map<string, number>>,
  areaCode: string,
  categoryIndicators: { code: string; invert?: boolean }[]
): number {
  const areaMap = allData.get(areaCode);
  if (!areaMap) return 50;

  let totalDeviation = 0;
  let count = 0;

  for (const { code, invert } of categoryIndicators) {
    // 全23区の値を集める
    const values: number[] = [];
    for (const [, am] of allData) {
      const v = am.get(code);
      if (v !== undefined) values.push(v);
    }
    if (values.length < 2) continue;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    );
    if (stdDev === 0) continue;

    const areaVal = areaMap.get(code);
    if (areaVal === undefined) continue;

    let deviation = ((areaVal - mean) / stdDev) * 10 + 50;
    if (invert) {
      deviation = 100 - deviation;
    }

    totalDeviation += deviation;
    count++;
  }

  if (count === 0) return 50;
  return Math.round(Math.max(0, Math.min(100, totalDeviation / count)));
}

function buildWardData(
  areaCode: string,
  allData: Map<string, Map<string, number>>,
  trendData: Map<string, { year: number; population: number }[]>
) {
  const areaMap = allData.get(areaCode);
  if (!areaMap) return null;

  const name = WARD_NAMES[areaCode] || areaCode;

  // 計算が必要な指標
  // C120110は千円単位 → 万円に変換するために /10
  const taxIncome = getValue(areaMap, "C120110");
  const taxpayers = getValue(areaMap, "C120120");
  const perCapitaTaxIncome = taxpayers > 0
    ? Math.round(taxIncome / taxpayers / 10)
    : 0;

  const totalHouseholds = getValue(areaMap, "A7101");
  const elderSingle = getValue(areaMap, "A8301");
  const elderSingleRate = totalHouseholds > 0
    ? Math.round((elderSingle / totalHouseholds) * 1000) / 10
    : 0;

  // avg23 を計算
  const avg = (code: string) => calcAvg23(allData, code);

  // 1人あたり課税所得の23区平均（千円→万円変換）
  let avgPerCapitaTax = 0;
  {
    let sum = 0;
    let cnt = 0;
    for (const [, am] of allData) {
      const ti = am.get("C120110");
      const tp = am.get("C120120");
      if (ti !== undefined && tp !== undefined && tp > 0) {
        sum += ti / tp / 10;
        cnt++;
      }
    }
    avgPerCapitaTax = cnt > 0 ? Math.round(sum / cnt) : 0;
  }

  // 65歳以上単独世帯率の23区平均
  let avgElderSingleRate = 0;
  {
    let sum = 0;
    let cnt = 0;
    for (const [, am] of allData) {
      const h = am.get("A7101");
      const es = am.get("A8301");
      if (h !== undefined && es !== undefined && h > 0) {
        sum += (es / h) * 100;
        cnt++;
      }
    }
    avgElderSingleRate = cnt > 0 ? Math.round((sum / cnt) * 10) / 10 : 0;
  }

  const city = {
    code: areaCode,
    name,
    population: {
      total: getValue(areaMap, "A1101"),
      male: getValue(areaMap, "A110101"),
      female: getValue(areaMap, "A110102"),
      under15: getValue(areaMap, "A1301"),
      age15to64: getValue(areaMap, "A1302"),
      over65: getValue(areaMap, "A1303"),
      foreigners: getValue(areaMap, "A1700"),
      trend: trendData.get(areaCode) || [],
    },
    childcare: {
      emoji: "\u{1F476}",
      label: "\u5b50\u80b2\u3066",
      color: "#22c55e",
      items: [
        {
          label: "\u4fdd\u80b2\u6240\u7b49\u6570",
          value: getValue(areaMap, "J2503"),
          unit: "\u304b\u6240",
          avg23: avg("J2503"),
        },
        {
          label: "\u5150\u7ae5\u798f\u7949\u65bd\u8a2d\u6570",
          value: getValue(areaMap, "J2501"),
          unit: "\u304b\u6240",
          avg23: avg("J2501"),
        },
      ],
    },
    medical: {
      emoji: "\u{1F3E5}",
      label: "\u533b\u7642",
      color: "#ef4444",
      items: [
        {
          label: "\u4e00\u822c\u75c5\u9662\u6570",
          value: getValue(areaMap, "I510120"),
          unit: "\u304b\u6240",
          avg23: avg("I510120"),
        },
        {
          label: "\u4e00\u822c\u8a3a\u7642\u6240\u6570",
          value: getValue(areaMap, "I5102"),
          unit: "\u304b\u6240",
          avg23: avg("I5102"),
        },
        {
          label: "\u533b\u5e2b\u6570",
          value: getValue(areaMap, "I6100"),
          unit: "\u4eba",
          avg23: avg("I6100"),
        },
      ],
    },
    safety: {
      emoji: "\u{1F6E1}\uFE0F",
      label: "\u5b89\u5168",
      color: "#f97316",
      items: [
        {
          label: "\u5211\u6cd5\u72af\u8a8d\u77e5\u4ef6\u6570",
          value: getValue(areaMap, "K4201"),
          unit: "\u4ef6",
          avg23: avg("K4201"),
        },
        {
          label: "\u4ea4\u901a\u4e8b\u6545\u767a\u751f\u4ef6\u6570",
          value: getValue(areaMap, "K3101"),
          unit: "\u4ef6",
          avg23: avg("K3101"),
        },
      ],
    },
    economy: {
      emoji: "\u{1F4B0}",
      label: "\u7d4c\u6e08",
      color: "#a855f7",
      items: [
        {
          label: "1\u4eba\u3042\u305f\u308a\u8ab2\u7a0e\u6240\u5f97",
          value: perCapitaTaxIncome,
          unit: "\u4e07\u5186",
          avg23: avgPerCapitaTax,
        },
        {
          label: "\u4e8b\u696d\u6240\u6570",
          value: getValue(areaMap, "C2107"),
          unit: "\u304b\u6240",
          avg23: avg("C2107"),
        },
        {
          label: "歳入決算総額",
          value: Math.round(getValue(areaMap, "D3201") / 100000),
          unit: "億円",
          avg23: (() => {
            let sum = 0;
            let cnt = 0;
            for (const [, am] of allData) {
              const v = am.get("D3201");
              if (v !== undefined) { sum += v / 100000; cnt++; }
            }
            return cnt > 0 ? Math.round(sum / cnt) : 0;
          })(),
        },
      ],
    },
    education: {
      emoji: "\u{1F4DA}",
      label: "\u6559\u80b2",
      color: "#0d9488",
      items: [
        {
          label: "\u5c0f\u5b66\u6821\u6570",
          value: getValue(areaMap, "E2101"),
          unit: "\u6821",
          avg23: avg("E2101"),
        },
        {
          label: "\u4e2d\u5b66\u6821\u6570",
          value: getValue(areaMap, "E3101"),
          unit: "\u6821",
          avg23: avg("E3101"),
        },
        {
          label: "\u56f3\u66f8\u9928\u6570",
          value: getValue(areaMap, "G1401"),
          unit: "\u9928",
          avg23: avg("G1401"),
        },
      ],
    },
    living: {
      emoji: "\u{1F3E0}",
      label: "\u66ae\u3089\u3057",
      color: "#3b82f6",
      items: [
        {
          label: "\u4e16\u5e2f\u6570",
          value: totalHouseholds,
          unit: "\u4e16\u5e2f",
          avg23: avg("A7101"),
        },
        {
          label: "\u7740\u5de5\u65b0\u8a2d\u4f4f\u5b85\u6238\u6570",
          value: getValue(areaMap, "H1800"),
          unit: "\u6238",
          avg23: avg("H1800"),
        },
        {
          label: "65\u6b73\u4ee5\u4e0a\u5358\u72ec\u4e16\u5e2f\u7387",
          value: elderSingleRate,
          unit: "%",
          avg23: avgElderSingleRate,
        },
      ],
    },
  };

  // スコア計算
  const scores = {
    childcare: calcScores(allData, areaCode, [
      { code: "J2503" },
      { code: "J2501" },
    ]),
    medical: calcScores(allData, areaCode, [
      { code: "I510120" },
      { code: "I5102" },
      { code: "I6100" },
    ]),
    safety: calcScores(allData, areaCode, [
      { code: "K4201", invert: true },
      { code: "K3101", invert: true },
    ]),
    economy: calcScores(allData, areaCode, [
      { code: "C120110" },
      { code: "C2107" },
      { code: "D3201" },
    ]),
    education: calcScores(allData, areaCode, [
      { code: "E2101" },
      { code: "E3101" },
      { code: "G1401" },
    ]),
    living: calcScores(allData, areaCode, [
      { code: "A7101" },
      { code: "H1800" },
      { code: "A8301", invert: true },
    ]),
  };

  return { city, scores };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── メイン ──

async function main() {
  console.log("=== e-Stat API から東京23区のデータを取得 ===\n");

  // 1. 全指標データ取得
  console.log("[1/2] 指標データ取得中...");
  const allData = await fetchAllIndicators();

  // 2. 人口トレンド取得
  console.log("\n[2/2] 人口トレンドデータ取得中...");
  const trendData = await fetchPopulationTrend();

  // 3. 各区のデータを構築
  console.log("\nデータ変換中...");
  const wards = [];
  for (const code of WARD_CODES) {
    const ward = buildWardData(code, allData, trendData);
    if (ward) {
      wards.push(ward);
      console.log(`  ${WARD_NAMES[code]}: OK`);
    } else {
      console.warn(`  ${WARD_NAMES[code]}: データなし`);
    }
  }

  // 4. avg23Scores を計算（全区の平均スコア）
  const avg23Scores = {
    childcare: 0,
    medical: 0,
    safety: 0,
    economy: 0,
    education: 0,
    living: 0,
  };
  for (const key of Object.keys(avg23Scores) as (keyof typeof avg23Scores)[]) {
    const sum = wards.reduce((s, w) => s + w.scores[key], 0);
    avg23Scores[key] = Math.round(sum / wards.length);
  }

  // 5. ランキング計算（スコアが高い順＝1位、人口が多い順＝1位）
  const scoreKeys = ["childcare", "medical", "safety", "economy", "education", "living"] as const;
  for (const key of scoreKeys) {
    const sorted = [...wards].sort((a, b) => b.scores[key] - a.scores[key]);
    sorted.forEach((w, i) => {
      if (!("rankings" in w)) {
        (w as any).rankings = {};
      }
      (w as any).rankings[key] = i + 1;
    });
  }
  // 人口ランキング
  const popSorted = [...wards].sort((a, b) => b.city.population.total - a.city.population.total);
  popSorted.forEach((w, i) => {
    (w as any).rankings.population = i + 1;
  });

  // 6. JSON書き出し
  const output = {
    generatedAt: new Date().toISOString(),
    avg23Scores,
    wards,
  };

  const outDir = path.resolve(import.meta.dirname, "../public/data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "wards.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`\n完了！ ${outPath} に書き出しました`);
  console.log(`  区数: ${wards.length}`);
  console.log(`  ファイルサイズ: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
