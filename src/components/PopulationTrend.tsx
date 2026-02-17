import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PopulationTrendProps {
  trend: { year: number; population: number }[];
  cityName: string;
}

export default function PopulationTrend({ trend }: PopulationTrendProps) {
  return (
    <div className="trend-inner">
      <h2 className="section-title">人口トレンド</h2>
      <div className="trend-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 16, left: -4, bottom: 8 }}>
            <CartesianGrid stroke="#f0f0f0" strokeDasharray="none" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: "#999" }}
              tickFormatter={(v) => `${v}`}
              axisLine={{ stroke: "#e0e0e0" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#999" }}
              tickFormatter={(v: number) => `${(v / 10000).toFixed(1)}万`}
              domain={["dataMin - 5000", "dataMax + 5000"]}
              width={42}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()}人`, "人口"]}
              labelFormatter={(label) => `${label}年`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e0e0e0" }}
            />
            <Line
              type="monotone"
              dataKey="population"
              stroke="#374151"
              strokeWidth={1.5}
              dot={{ r: 2, fill: "#374151", strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
