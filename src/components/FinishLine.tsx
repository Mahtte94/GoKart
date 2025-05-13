import React from 'react';
import { Flag } from 'lucide-react';

interface FinishLineProps {
  position: { x: number; y: number };
}

const FinishLine: React.FC<FinishLineProps> = ({ position }) => {
  return (
    <div 
      className="absolute flex flex-col items-center"
      style={{
        transform: `translate(${position.x - 40}px, ${position.y - 10}px)`,
        zIndex: 5
      }}
    >
      {/* More compact checkered pattern */}
      <div className="flex">
        <div className="w-8 h-6 bg-white"></div>
        <div className="w-8 h-6 bg-black"></div>
        <div className="w-8 h-6 bg-white"></div>
        <div className="w-8 h-6 bg-black"></div>
        <div className="w-8 h-6 bg-white"></div>
      </div>
    </div>
  );
};

export default FinishLine;