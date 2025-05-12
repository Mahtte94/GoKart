import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialTime?: number;
  onTimeUp?: () => void;
  isPaused?: boolean;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({
  initialTime = 60, 
  onTimeUp,
  isPaused = false,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(!isPaused);

  
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${minsStr}:${secsStr}`;
  }, []);

  
  const getColorClass = useCallback((seconds: number): string => {
    if (seconds <= 10) return 'text-red-500';
    if (seconds <= 30) return 'text-yellow-500';
    return 'text-green-500';
  }, []);

  
  const resetTimer = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(true);
  }, [initialTime]);

  // Timer effect
  useEffect(() => {
    let interval: number | undefined = undefined;

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && onTimeUp) {
      onTimeUp();
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isRunning, timeLeft, onTimeUp]);

 
  useEffect(() => {
    setIsRunning(!isPaused);
  }, [isPaused]);

  return (
    <div className={`flex items-center justify-center space-x-2 bg-gray-800 bg-opacity-75 px-4 py-2 rounded-lg shadow-md ${className}`}>
      <Clock className={`w-5 h-5 ${getColorClass(timeLeft)}`} />
      <span className={`font-mono text-xl font-bold ${getColorClass(timeLeft)}`}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default Timer;