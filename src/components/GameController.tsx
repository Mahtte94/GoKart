import React, { useState, useCallback, useRef, useEffect } from 'react';
import Gokart from './Gokart';
import Timer from './Timer';
import LapIndicator from './LapIndicator';
import FinishLine from './FinishLine';
import Checkpoint from './checkpoint';
import DebugOverlay from './DebugOverlay';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flag, CheckCircle } from 'lucide-react';

type GameState = 'ready' | 'playing' | 'gameover' | 'finished';


const FINISH_LINE = {
  x: 440,
  y: 0, 
  width: 80, 
  height: 100, 
};


const CHECKPOINTS = [
  {
    id: 1,
    x: 166, // Left side of the track
    y: 360,
    radius: 60, 
  },
  {
    id: 2,
    x: 643, // Right side of the track
    y: 389,
    radius: 60, 
  }
];

const GameController: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState<number>(0);
  
  
  const [currentLap, setCurrentLap] = useState<number>(0);
  const [totalLaps] = useState<number>(3);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const checkpointsPassedRef = useRef<boolean[]>([false, false]); // Track multiple checkpoints
  const canCountLapRef = useRef<boolean>(false);
  
  // Debug mode (can be toggled with D key)
  const [showDebug, setShowDebug] = useState<boolean>(true); // Default to true for troubleshooting
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleFinish = useCallback(() => {
    setGameState('finished');
    
    if (bestTime === null || currentTime < bestTime) {
      setBestTime(currentTime);
    }
  }, [currentTime, bestTime]);

  // Function to track position and detect when a lap is completed
  const handlePositionUpdate = useCallback((position: { x: number; y: number }) => {
    // Store the last position
    lastPositionRef.current = position;
    
    // Debug position with clear logging
    if (showDebug) {
      console.log(`Position: x=${Math.round(position.x)}, y=${Math.round(position.y)}, 
        Checkpoints: [${checkpointsPassedRef.current.join(', ')}], 
        Can count lap: ${canCountLapRef.current}`);
    }
    
    // Detect if player is crossing the finish line
    const isOnFinishLine = 
      position.x >= FINISH_LINE.x - FINISH_LINE.width / 2 &&
      position.x <= FINISH_LINE.x + FINISH_LINE.width / 2 &&
      position.y >= FINISH_LINE.y - 5 &&
      position.y <= FINISH_LINE.y + FINISH_LINE.height;
    
    // Check if player has passed each checkpoint
    CHECKPOINTS.forEach((checkpoint, index) => {
      const distanceToCheckpoint = Math.sqrt(
        Math.pow(position.x - checkpoint.x, 2) + 
        Math.pow(position.y - checkpoint.y, 2)
      );
      
      if (distanceToCheckpoint <= checkpoint.radius && !checkpointsPassedRef.current[index]) {
        checkpointsPassedRef.current[index] = true;
        
        // Log for debugging
        if (showDebug) {
          console.log(`Checkpoint ${index + 1} passed!`);
        }
      }
    });
    
    // Check if all checkpoints have been passed
    const allCheckpointsPassed = checkpointsPassedRef.current.every(passed => passed);
    
    // Count a lap when player crosses finish line after passing all checkpoints
    if (isOnFinishLine && allCheckpointsPassed && canCountLapRef.current) {
      setCurrentLap(prev => {
        const newLap = prev + 1;
        
        // Log for debugging
        console.log(`Lap completed! New lap: ${newLap}`);
        
        // End game if all laps are completed
        if (newLap >= totalLaps) {
          handleFinish();
        }
        return newLap;
      });
      
      // Reset checkpoint status and disable lap counting temporarily
      checkpointsPassedRef.current = [false, false];
      canCountLapRef.current = false;
      
      // After a short delay, allow lap counting again
      // This prevents multiple lap counts if player stays on finish line
      setTimeout(() => {
        canCountLapRef.current = true;
      }, 1000);
    }
  }, [handleFinish, totalLaps, showDebug]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setCurrentTime(0);
    setCurrentLap(0);
    setGameKey(prevKey => prevKey + 1);
    
    // Initialize lap tracking state
    checkpointsPassedRef.current = [false, false]; // Reset both checkpoints
    canCountLapRef.current = true;
    
    console.log("Game started! Lap tracking initialized.");
    
    if (containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      } else {
        containerRef.current.focus();
      }
    }
  }, []);

  const formatTime = useCallback((seconds: number | null): string => {
    if (seconds === null) return "--:--";
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
    
    return `${minsStr}:${secsStr}`;
  }, []);

  const ControlInstructions = () => (
    <div className="flex flex-col items-center mb-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-3 text-lg">Tangentbordskontroller:</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div></div>
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-lg p-2 w-12 h-12 flex items-center justify-center mb-1">
            <ArrowUp className="text-white w-6 h-6" />
          </div>
          <span className="text-white text-sm">Framåt</span>
        </div>
        <div></div>
        
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-lg p-2 w-12 h-12 flex items-center justify-center mb-1">
            <ArrowLeft className="text-white w-6 h-6" />
          </div>
          <span className="text-white text-sm">Vänster</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-lg p-2 w-12 h-12 flex items-center justify-center mb-1">
            <ArrowDown className="text-white w-6 h-6" />
          </div>
          <span className="text-white text-sm">Bakåt</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-lg p-2 w-12 h-12 flex items-center justify-center mb-1">
            <ArrowRight className="text-white w-6 h-6" />
          </div>
          <span className="text-white text-sm">Höger</span>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-screen bg-gray-900"
      tabIndex={-1}
    >
      {/* Game header with timer */}
      <div className="flex justify-between items-center p-3 bg-gray-800">
        <h2 className="text-2xl font-bold text-white">Go-Kart Race</h2>
        
        <div className="flex items-center space-x-4">
          {bestTime !== null && (
            <div className="text-yellow-300 font-mono">
              <span className="mr-2 font-bold">BÄSTA TID:</span>
              {formatTime(bestTime)}
            </div>
          )}
          
          {gameState === 'playing' && (
            <>
              <LapIndicator currentLap={currentLap} totalLaps={totalLaps} />
              <Timer 
                initialTime={0}
                isRunning={gameState === 'playing'}
                onTimeUpdate={handleTimeUpdate}
              />
            </>
          )}
        </div>
      </div>

      {/* Main game area - centered with fixed height */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="relative">
            <Gokart 
              key={gameKey}
              isGameActive={gameState === 'playing'}
              onPositionUpdate={handlePositionUpdate}
            />
            <FinishLine position={{ x: FINISH_LINE.x, y: FINISH_LINE.y }} />
            {gameState === 'playing' && (
              <>
                {CHECKPOINTS.map((checkpoint, index) => (
                  <Checkpoint 
                    key={checkpoint.id}
                    position={{ x: checkpoint.x, y: checkpoint.y }} 
                    isPassed={checkpointsPassedRef.current[index]}
                    index={index + 1}
                  />
                ))}
              </>
            )}
            
            {/* Debug overlay - toggle with 'D' key */}
            {showDebug && gameState === 'playing' && (
              <DebugOverlay
                position={lastPositionRef.current}
                checkpointsPassed={checkpointsPassedRef.current}
                currentLap={currentLap}
                canCountLap={canCountLapRef.current}
              />
            )}
            
            {/* Game overlays */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold mb-3 text-white">Go-Kart Race</h2>
                <p className="text-lg mb-1 text-white">Kör {totalLaps} varv runt banan så snabbt du kan!</p>
                <p className="text-sm mb-4 text-yellow-300 flex items-center justify-center">
                  <Flag size={14} className="inline mr-1" />
                  Du måste passera båda checkpoints
                  <CheckCircle size={14} className="inline mx-1" />
                  för att räkna ett varv!
                </p>
                
                {/* Keyboard control instructions */}
                <ControlInstructions />
                
                <button 
                  onClick={startGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
                >
                  Starta Lopp
                </button>
              </div>
            )}
            
            {gameState === 'finished' && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold mb-3 text-green-500">
                  <Flag className="inline-block mr-2 mb-1" size={28} />
                  Målgång!
                </h2>
                <p className="text-xl mb-1 text-white">Du klarade alla {totalLaps} varv!</p>
                <p className="text-xl mb-4 text-white">Din tid: <span className="font-mono font-bold">{formatTime(currentTime)}</span></p>
                
                {bestTime === currentTime && (
                  <div className="bg-yellow-600 px-4 py-2 rounded-lg mb-4">
                    <p className="text-xl text-yellow-300 font-bold">Nytt rekord!</p>
                  </div>
                )}
                
                <button 
                  onClick={startGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg mt-2"
                >
                  Kör Igen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameController;