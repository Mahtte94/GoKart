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
      
     
     
    </div>
  );
};

export default FinishLine;