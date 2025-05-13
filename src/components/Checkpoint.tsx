import React from 'react';
import { CheckCircle } from 'lucide-react';

interface CheckpointProps {
  position: { x: number; y: number };
  isPassed: boolean;
}

const Checkpoint: React.FC<CheckpointProps> = ({ position, isPassed }) => {
  return (
    <div 
      className="absolute"
      style={{
        transform: `translate(${position.x - 15}px, ${position.y - 15}px)`,
        zIndex: 5,
        transition: 'all 0.3s ease'
      }}
    >
      {/* Smaller checkpoint with glow */}
      <div className={`p-2 rounded-full ${isPassed ? 'bg-green-600' : 'bg-yellow-600'} animate-pulse shadow-lg`} style={{
        boxShadow: isPassed 
          ? '0 0 10px 3px rgba(16, 185, 129, 0.7)' 
          : '0 0 10px 3px rgba(245, 158, 11, 0.7)'
      }}>
        <CheckCircle 
          size={20} 
          className="text-white" 
          strokeWidth={isPassed ? 3 : 2}
        />
      </div>
    </div>
  );
};

export default Checkpoint;