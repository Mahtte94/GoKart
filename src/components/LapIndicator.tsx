import React from 'react';

interface LapIndicatorProps {
  currentLap: number;
  totalLaps: number;
}

const LapIndicator: React.FC<LapIndicatorProps> = ({ currentLap, totalLaps }) => {
  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-2 md:px-3 py-1 rounded-lg shadow-lg">
      <div className="flex flex-col items-center">
        <div className="text-xs sm:text-sm md:text-base font-bold text-white">
          <span className="hidden sm:inline">Varv </span>{currentLap}/{totalLaps}
        </div>
        
        {/* Progress bar - hide on very small screens */}
        <div className="w-full bg-gray-700 rounded-full h-1 md:h-1.5 mt-1 hidden sm:block">
          <div 
            className="bg-yellow-400 h-full rounded-full" 
            style={{ width: `${(currentLap / totalLaps) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LapIndicator;