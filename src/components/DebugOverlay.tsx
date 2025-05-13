import React from 'react';

interface DebugOverlayProps {
  position: { x: number; y: number };
  checkpointPassed: boolean;
  currentLap: number;
  canCountLap: boolean;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({
  position,
  checkpointPassed,
  currentLap,
  canCountLap
}) => {
  return (
    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white p-2 rounded text-xs font-mono z-50 border border-gray-700">
      <div>Position: x={Math.round(position.x)}, y={Math.round(position.y)}</div>
      <div>Checkpoint: {checkpointPassed ? '✅ Passed' : '❌ Not passed'}</div>
      <div>Lap counting: {canCountLap ? '✅ Enabled' : '❌ Disabled'}</div>
      <div>Current lap: {currentLap}</div>
    </div>
  );
};

export default DebugOverlay;