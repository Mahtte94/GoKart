import React from 'react';
import { CheckCircle, CircleDot } from 'lucide-react';

interface CheckpointProps {
  position: { x: number; y: number };
  isPassed: boolean;
  index: number; // Add index to identify checkpoints
}

const Checkpoint: React.FC<CheckpointProps> = ({ position, isPassed, index }) => {
  return (
    <div 
      className="absolute"
      style={{
        transform: `translate(${position.x - 20}px, ${position.y - 20}px)`,
        zIndex: 5,
        transition: 'all 0.3s ease'
      }}
    >
      {/* Larger checkpoint with better visibility */}
      <div 
        className={`p-3 rounded-full ${isPassed ? 'bg-green-600' : 'bg-yellow-600'} animate-pulse shadow-lg flex items-center justify-center`} 
        style={{
          boxShadow: isPassed 
            ? '0 0 15px 5px rgba(16, 185, 129, 0.7)' 
            : '0 0 15px 5px rgba(245, 158, 11, 0.7)'
        }}
      >
        {isPassed ? (
          <CheckCircle size={26} className="text-white" strokeWidth={2.5} />
        ) : (
          <CircleDot size={26} className="text-white" strokeWidth={2.5} />
        )}
        
        {/* Checkpoint number indicator */}
        <div className="absolute -top-6 left-0 right-0 text-center">
          <span className="bg-gray-900 text-white px-2 py-1 rounded-md text-xs font-bold">
            Checkpoint {index}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Checkpoint;