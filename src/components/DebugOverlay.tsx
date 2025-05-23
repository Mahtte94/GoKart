import React from 'react';

interface DebugOverlayProps {
  position: { x: number; y: number };
  checkpointsPassed: boolean[]; // Array of checkpoints
  currentLap: number;
  canCountLap: boolean;
  isOnTrack?: boolean;
  currentSpeed?: number; // Added speed display
  maxSpeed?: number; // Added max speed
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({
  position,
  checkpointsPassed,
  currentLap,
  canCountLap,
  isOnTrack = true,
  currentSpeed = 0, 
  maxSpeed = 8
}) => {
  return (
    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white p-2 rounded text-xs font-mono z-50 border border-gray-700">
      <h3 className="font-bold border-b border-gray-700 pb-1 mb-2">Debug Information</h3>
      
      <div>Position: x={Math.round(position.x)}, y={Math.round(position.y)}</div>
      
      <div className="mt-2 border-t border-gray-700 pt-1">
        <div className="font-bold mb-1">Checkpoints:</div>
        <div className="grid grid-cols-2 gap-x-4">
          {checkpointsPassed.map((passed, index) => (
            <div key={index} className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>CP {index + 1}: {passed ? 'Passed' : 'Not passed'}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-2 border-t border-gray-700 pt-1">
        <div>Lap counting: 
          <span className={`ml-2 font-bold ${canCountLap ? 'text-green-500' : 'text-red-500'}`}>
            {canCountLap ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
        <div>Current lap: <span className="font-bold">{currentLap}</span></div>
      </div>
      
      <div className="mt-2 border-t border-gray-700 pt-1">
        <div className="font-bold mb-1">Terrain:</div>
        <div className="flex items-center">
          <div className={`h-4 w-4 rounded-full mr-2 ${isOnTrack ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
          <span className={isOnTrack ? 'text-blue-300' : 'text-yellow-300'}>
            {isOnTrack ? '🛣️ TRACK (100% speed)' : '🌱 GRASS (40% speed)'}
          </span>
        </div>
      </div>
      
      <div className="mt-2 border-t border-gray-700 pt-1">
        <div className="font-bold mb-1">Performance:</div>
        <div className="flex items-center gap-2 mb-1">
          <div>Speed:</div>
          <div className="w-24 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${isOnTrack ? 'bg-blue-500' : 'bg-yellow-500'}`}
              style={{ width: `${(Math.abs(currentSpeed) / maxSpeed) * 100}%` }}
            ></div>
          </div>
          <div>{Math.abs(currentSpeed).toFixed(1)}/{maxSpeed.toFixed(1)}</div>
        </div>
      </div>
      
      <div className="mt-2 border-t border-gray-700 pt-1 text-gray-400 text-[10px]">
        Press <kbd className="bg-gray-700 px-1 rounded">D</kbd> to hide debug | 
        <kbd className="bg-gray-700 px-1 rounded ml-1">T</kbd> to show track map
      </div>
    </div>
  );
};

export default DebugOverlay;