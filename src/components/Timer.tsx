import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialTime?: number;
  isRunning?: boolean;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

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

  // Timer effect - only update local state
  useEffect(() => {
    let interval: number | undefined = undefined;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isRunning]);
  
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  }, [time, onTimeUpdate]);

  return (
    <div className={`flex items-center justify-center space-x-2 bg-gray-800 bg-opacity-75 px-4 py-2 rounded-lg shadow-md ${className}`}>
      <Clock className={`w-5 h-5 ${getColorClass(time)}`} />
      <span className={`font-mono text-xl font-bold ${getColorClass(time)}`}>
        {formatTime(time)}
      </span>
    </div>
  );
};

export default Timer;