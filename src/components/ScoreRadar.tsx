import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";

import type { Scores } from "../data/types";

interface ScoreRadarProps {
  scores: Scores;
  avgScores: Scores;
  cityName: string;
}

const AXES: { key: keyof Scores; label: string }[] = [
  { key: "childcare", label: "子育て" },
  { key: "medical", label: "医療" },
  { key: "safety", label: "安全" },
  { key: "economy", label: "経済" },
  { key: "education", label: "教育" },
  { key: "living", label: "暮らし" },
];

export default function ScoreRadar({ scores, avgScores, cityName }: ScoreRadarProps) {
  const data = AXES.map(({ key, label }) => ({
    axis: label,
    [cityName]: scores[key],
    "23区平均": avgScores[key],
  }));

  return (
    <div className="radar-inner">
      <h2 className="section-title">まちのスコア</h2>
      <div className="radar-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="48%" outerRadius="75%">
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 13, fill: "#4b5563", fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
            />
            <Radar
              name={cityName}
              dataKey={cityName}
              stroke="#374151"
              fill="#374151"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="23区平均"
              dataKey="23区平均"
              stroke="#d1d5db"
              fill="#d1d5db"
              fillOpacity={0.2}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: "#6b7280",
                paddingTop: 12,
              }}
              iconType="plainline"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
