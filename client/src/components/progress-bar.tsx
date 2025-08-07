import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export default function ProgressBar({ current, total, className = "" }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <Progress 
        value={percentage} 
        className="w-full h-3 progress-bar-animation"
      />
      <div className="flex justify-between text-xs text-gray-600">
        <span>ข้อ {current} จาก {total}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
}
