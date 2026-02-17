// 数値フォーマット
export function formatNumber(value: number): string {
  if (value >= 10000) {
    return value.toLocaleString("ja-JP");
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString("ja-JP");
  }
  return value.toFixed(2);
}

// 比較の差分を計算（%表記）
export function calcDiff(value: number, avg: number): { diff: number; isPositive: boolean } {
  const diff = ((value - avg) / avg) * 100;
  return { diff: Math.abs(diff), isPositive: diff >= 0 };
}
