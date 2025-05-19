import React from 'react';

interface LapIndicatorProps {
  currentLap: number;
  totalLaps: number;
}

const LapIndicator: React.FC<LapIndicatorProps> = ({ currentLap, totalLaps }) => {
  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-3 py-1 rounded-lg shadow-lg">
      <div className="flex flex-col items-center">
        <div className="text-base font-bold text-white">
          Varv {currentLap} / {totalLaps}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
          <div 
            className="bg-yellow-400 h-1.5 rounded-full" 
            style={{ width: `${(currentLap / totalLaps) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LapIndicator;