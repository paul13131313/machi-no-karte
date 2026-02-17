import { useState, useEffect } from "react";
import type { WardsData, WardEntry, Scores } from "../data/types";

interface UseWardDataResult {
  loading: boolean;
  error: string | null;
  wards: WardEntry[];
  selected: WardEntry | null;
  selectedCode: string;
  setSelectedCode: (code: string) => void;
  avg23Scores: Scores;
}

const DEFAULT_SCORES: Scores = {
  childcare: 50,
  medical: 50,
  safety: 50,
  economy: 50,
  education: 50,
  living: 50,
};

export default function useWardData(): UseWardDataResult {
  const [data, setData] = useState<WardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState("13113"); // デフォルト: 渋谷区

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/wards.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: WardsData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const selected = data?.wards.find((w) => w.city.code === selectedCode) ?? null;

  return {
    loading,
    error,
    wards: data?.wards ?? [],
    selected,
    selectedCode,
    setSelectedCode,
    avg23Scores: data?.avg23Scores ?? DEFAULT_SCORES,
  };
}
