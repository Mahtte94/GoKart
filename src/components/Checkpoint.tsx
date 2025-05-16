import React from 'react';
import { Circle } from 'lucide-react';

interface CheckpointProps {
  position: { x: number; y: number };
  isPassed: boolean;
  index: number;
}

const Checkpoint: React.FC<CheckpointProps> = ({ position, isPassed, index }) => {
  return (
    <div 
      className="absolute left-0 top-0"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: 9999, // Extremely high z-index to ensure it's above everything
        width: 0,
        height: 0,
        pointerEvents: 'none' // So it doesn't interfere with game controls
      }}
    >
      {/* Outer pulsing circle */}
      <div 
        className={`absolute ${isPassed ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`}
        style={{
          opacity: 0.6,
          width: '80px',
          height: '80px',
          left: '-40px',
          top: '-40px',
          boxShadow: isPassed 
            ? '0 0 30px 10px rgba(16, 185, 129, 0.7)' 
            : '0 0 30px 10px rgba(245, 158, 11, 0.7)',
          animation: 'pulse 1.5s infinite'
        }}
      />
      
      {/* Inner circle */}
      <div 
        className={`absolute ${isPassed ? 'bg-green-600' : 'bg-yellow-600'} rounded-full flex items-center justify-center border-4 ${isPassed ? 'border-green-800' : 'border-yellow-800'}`}
        style={{
          width: '50px',
          height: '50px',
          left: '-25px',
          top: '-25px',
        }}
      >
        <Circle 
          className="text-white" 
          size={30} 
          fill={isPassed ? "#10B981" : "#D97706"} 
          strokeWidth={3}
        />
      </div>
      
      {/* Text label outside of circles */}
      <div 
        className="absolute whitespace-nowrap font-bold"
        style={{
          top: '-70px',
          left: '-40px',
          width: '80px',
          textAlign: 'center'
        }}
      >
        <span className={`${isPassed ? 'bg-green-800' : 'bg-yellow-800'} text-white px-3 py-1 rounded-full text-sm`}>
          CP {index}
        </span>
      </div>
    </div>
  );
};

export default Checkpoint;