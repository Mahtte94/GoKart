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
        transform: `translate(${position.x - 40}px, ${position.y - 15}px)`,
        zIndex: 5
      }}
    >
      {/* Flag icon for better visibility */}
      <Flag className="text-black absolute -top-8 right-16" size={24} />
      
      {/* Checkered pattern matching the screenshot */}
      <div className="flex">
        <div className="w-8 h-6 bg-white"></div>
        <div className="w-8 h-6 bg-black"></div>
        <div className="w-8 h-6 bg-white"></div>
        <div className="w-8 h-6 bg-black"></div>
        <div className="w-8 h-6 bg-white"></div>
      </div>
      <div className="flex">
        <div className="w-8 h-6 bg-black"></div>
        <div className="w-8 h-6 bg-white"></div>
        <div className="w-8 h-6 bg-black"></div>
        <div className="w-8 h-6 bg-white"></div>
        <div className="w-8 h-6 bg-black"></div>
      </div>
    </div>
  );
};

export default FinishLine;