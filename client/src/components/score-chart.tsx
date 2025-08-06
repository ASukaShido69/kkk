import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import type { Score } from "@/lib/types";

interface ScoreChartProps {
  scores: Score[];
  type?: "line" | "bar";
  height?: number;
}

export default function ScoreChart({ scores, type = "line", height = 320 }: ScoreChartProps) {
  const chartData = useMemo(() => {
    if (!scores || scores.length === 0) return [];
    
    return scores
      .slice()
      .reverse() // Show chronological order
      .map((score, index) => ({
        exam: `ครั้งที่ ${scores.length - index}`,
        score: Math.round((score.correctAnswers / score.totalQuestions) * 100),
        date: new Date(score.dateTaken || 0).toLocaleDateString('th-TH', {
          month: 'short',
          day: 'numeric'
        }),
        examType: score.examType,
        timeSpent: Math.round(score.timeSpent / 60), // Convert to minutes
      }));
  }, [scores]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-secondary-gray rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-primary-blue font-bold">
            คะแนน: {payload[0].value}%
          </p>
          <p className="text-sm text-gray-600">วันที่: {data.date}</p>
          <p className="text-sm text-gray-600">ประเภท: {data.examType}</p>
          <p className="text-sm text-gray-600">เวลาที่ใช้: {data.timeSpent} นาที</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-lg">ยังไม่มีข้อมูลคะแนน</div>
          <div className="text-sm">เริ่มทำข้อสอบเพื่อดูกราฟคะแนน</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "line" ? (
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 5.9%, 90%)" />
          <XAxis 
            dataKey="exam" 
            stroke="hsl(25, 5.3%, 44.7%)"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="hsl(25, 5.3%, 44.7%)"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="hsl(207, 90%, 54%)"
            strokeWidth={3}
            dot={{ fill: "hsl(207, 90%, 54%)", strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: "hsl(207, 90%, 54%)", strokeWidth: 2 }}
          />
        </LineChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 5.9%, 90%)" />
          <XAxis 
            dataKey="exam" 
            stroke="hsl(25, 5.3%, 44.7%)"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="hsl(25, 5.3%, 44.7%)"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="score" 
            fill="hsl(207, 90%, 54%)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
