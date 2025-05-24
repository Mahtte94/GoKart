import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialTime?: number;
  isRunning?: boolean;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

type TimerInterval = ReturnType<typeof setTimeout>; // Use this instead of NodeJS.Timeout

const Timer: React.FC<TimerProps> = ({
  initialTime = 0,
  isRunning = true,
  onTimeUpdate,
  className = '',
}) => {
  const [time, setTime] = useState<number>(initialTime);
  
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${minsStr}:${secsStr}`;
  }, []);
  
  const getColorClass = useCallback((seconds: number): string => {
    if (seconds < 60) return 'text-green-500';
    if (seconds < 120) return 'text-yellow-500';
    return 'text-red-500';
  }, []);

  useEffect(() => {
    let interval: TimerInterval | undefined = undefined;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          if (onTimeUpdate) {
            onTimeUpdate(newTime);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeUpdate]);
  
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  }, [time, onTimeUpdate]);

  return (
    <div className={`flex items-center justify-center space-x-1 md:space-x-2 bg-gray-800 bg-opacity-75 px-2 md:px-4 py-1 md:py-2 rounded-lg shadow-md ${className}`}>
      <Clock className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${getColorClass(time)}`} />
      <span className={`font-mono text-xs sm:text-base md:text-xl font-bold ${getColorClass(time)}`}>
        {formatTime(time)}
      </span>
    </div>
  );
};

export default Timer;