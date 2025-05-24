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
        zIndex: 9999,
        width: 0,
        height: 0,
        pointerEvents: 'none'
      }}
    >
      {/* Outer pulsing circle - made smaller */}
      <div 
        className={`absolute ${isPassed ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`}
        style={{
          opacity: 0.4,
          width: '50px',
          height: '50px',
          left: '-25px',
          top: '-25px',
          boxShadow: isPassed 
            ? '0 0 20px 5px rgba(16, 185, 129, 0.5)'
            : '0 0 20px 5px rgba(245, 158, 11, 0.5)',
          animation: 'pulse 1.5s infinite'
        }}
      />
      
      {/* Inner circle - made smaller */}
      <div 
        className={`absolute ${isPassed ? 'bg-green-600' : 'bg-yellow-600'} rounded-full flex items-center justify-center border-2 ${isPassed ? 'border-green-800' : 'border-yellow-800'}`}
        style={{
          width: '32px',
          height: '32px',
          left: '-16px',
          top: '-16px',
        }}
      >
        <Circle 
          className="text-white" 
          size={20}
          fill={isPassed ? "#10B981" : "#D97706"} 
          strokeWidth={2}
        />
      </div>
      
      {/* Text label outside of circles - adjusted position */}
      <div 
        className="absolute whitespace-nowrap font-bold"
        style={{
          top: '-45px', // Adjusted for smaller circles
          left: '-25px', // Adjusted for smaller circles
          width: '50px', // Adjusted width
          textAlign: 'center'
        }}
      >
        <span className={`${isPassed ? 'bg-green-800' : 'bg-yellow-800'} text-white px-2 py-1 rounded-full text-xs`}>
          CP {index}
        </span>
      </div>
    </div>
  );
};

export default Checkpoint;