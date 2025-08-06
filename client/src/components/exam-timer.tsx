import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface ExamTimerProps {
  duration: number; // Duration in seconds
  onTimeUp: () => void;
  startTime: Date;
}

export default function ExamTimer({ duration, onTimeUp, startTime }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, startTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return "text-red-600"; // Last 5 minutes
    if (timeRemaining <= 1800) return "text-yellow-600"; // Last 30 minutes
    return "text-primary-blue";
  };

  const getTimeBgColor = () => {
    if (timeRemaining <= 300) return "bg-red-50 border-red-200";
    if (timeRemaining <= 1800) return "bg-yellow-50 border-yellow-200";
    return "bg-blue-50 border-blue-200";
  };

  return (
    <div className="text-right">
      <div className="text-sm text-gray-600 mb-1">เวลาที่เหลือ</div>
      <Badge 
        variant="outline" 
        className={`text-lg font-bold px-3 py-1 ${getTimeColor()} ${getTimeBgColor()} ${
          timeRemaining <= 300 ? "pulse-animation" : ""
        }`}
      >
        {formatTime(timeRemaining)}
      </Badge>
    </div>
  );
}
