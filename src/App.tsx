import { useMemo } from "react";
import useWardData from "./hooks/useWardData";
import ScoreRadar from "./components/ScoreRadar";
import PopulationSummary from "./components/PopulationSummary";
import PopulationTrend from "./components/PopulationTrend";
import StatCard from "./components/StatCard";
import WardSelector from "./components/WardSelector";
import { calcPerCapitaScores } from "./utils/calcScores";
import "./App.css";

function App() {
  const { loading, error, wards, selected, selectedCode, setSelectedCode, avg23Scores } =
    useWardData();

  // 人口あたりデータからスコアを再計算（フックは早期リターンより前に配置）
  const calculatedScores = useMemo(() => {
    if (wards.length === 0 || !selected) {
      return null;
    }
    return calcPerCapitaScores(wards, selectedCode);
  }, [wards, selectedCode, selected]);

  if (loading) {
    return <div className="app loading-screen">読み込み中...</div>;
  }

  if (error || !selected) {
    return <div className="app loading-screen">データの読み込みに失敗しました</div>;
  }

  const { city, scores: originalScores } = selected;

  // 23区平均人口を計算
  const avg23Population = wards.length > 0
    ? wards.reduce((sum, w) => sum + w.city.population.total, 0) / wards.length
    : 400000; // フォールバック

  const population = city.population.total;

  // スコアを取得（計算済みまたはオリジナル）
  const scores = calculatedScores?.scores ?? originalScores;
  const perCapitaAvg23Scores = calculatedScores?.avg23Scores ?? avg23Scores;

  return (
    <div className="app">
      <main className="bento">
        <header className="bento-cell cell-header">
          <h1 className="header-title">
            まちのカルテ
          </h1>
          <WardSelector
            wards={wards}
            selectedCode={selectedCode}
            onChange={setSelectedCode}
          />
        </header>

        <div className="bento-cell cell-radar">
          <ScoreRadar
            scores={scores}
            avgScores={perCapitaAvg23Scores}
            cityName={city.name}
          />
        </div>

        <div className="bento-cell cell-trend">
          <PopulationTrend
            trend={city.population.trend}
            cityName={city.name}
          />
        </div>

        <div className="bento-cell cell-pop">
          <PopulationSummary population={city.population} />
        </div>

        <div className="bento-cell cell-stat cell-stat-1">
          <StatCard category={city.childcare} population={population} avg23Population={avg23Population} />
        </div>
        <div className="bento-cell cell-stat cell-stat-2">
          <StatCard category={city.medical} population={population} avg23Population={avg23Population} />
        </div>
        <div className="bento-cell cell-stat cell-stat-3">
          <StatCard category={city.safety} population={population} avg23Population={avg23Population} />
        </div>
        <div className="bento-cell cell-stat cell-stat-4">
          <StatCard category={city.economy} population={population} avg23Population={avg23Population} />
        </div>
        <div className="bento-cell cell-stat cell-stat-5">
          <StatCard category={city.education} population={population} avg23Population={avg23Population} />
        </div>
        <div className="bento-cell cell-stat cell-stat-6">
          <StatCard category={city.living} population={population} avg23Population={avg23Population} />
        </div>

        <footer className="source-note">
          ※ %は人口1万人あたりに換算して23区平均と比較 ｜ 出典: e-Stat 社会・人口統計体系
        </footer>
      </main>
    </div>
  );
}

export default App;
