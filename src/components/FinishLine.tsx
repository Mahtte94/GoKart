import React from 'react';

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
    
     
     
    </div>
  );
};

export default FinishLine;