import React from 'react';

interface DebugOverlayProps {
  position: { x: number; y: number };
  checkpointsPassed: boolean[]; // Update to array of checkpoints
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
      <div>Position: x={Math.round(position.x)}, y={Math.round(position.y)}</div>
      <div>Checkpoint 1: {checkpointsPassed[0] ? '✅ Passed' : '❌ Not passed'}</div>
      <div>Checkpoint 2: {checkpointsPassed[1] ? '✅ Passed' : '❌ Not passed'}</div>
      <div>Lap counting: {canCountLap ? '✅ Enabled' : '❌ Disabled'}</div>
      <div>Current lap: {currentLap}</div>
      <div>
        Terrain: {isOnTrack ? '🛣️ Track (100% speed)' : '🌱 Grass (40% speed)'}
      </div>
      <div className="mt-1 border-t border-gray-700 pt-1">
        <div className="flex items-center gap-2">
          <div>Speed:</div>
          <div className="w-20 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${isOnTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${(Math.abs(currentSpeed) / maxSpeed) * 100}%` }}
            ></div>
          </div>
          <div>{Math.abs(currentSpeed).toFixed(1)}/{maxSpeed.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};

export default DebugOverlay;