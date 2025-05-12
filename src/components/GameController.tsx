import React, { useState, useCallback, useRef } from 'react';
import Gokart from './Gokart';
import Timer from './Timer';

type GameState = 'ready' | 'playing' | 'gameover' | 'finished';

const GameController: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleFinish = useCallback(() => {
    setGameState('finished');
    
    // Update best time if this run is better or it's the first run
    if (bestTime === null || currentTime < bestTime) {
      setBestTime(currentTime);
    }
  }, [currentTime, bestTime]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setCurrentTime(0);
    
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

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col"
      tabIndex={-1}
    >
      {/* Game header with timer */}
      <div className="flex justify-between items-center mb-2 px-4 py-2 bg-gray-800 bg-opacity-50 rounded-lg">
        <h2 className="text-xl font-bold text-white">Go-Kart Race</h2>
        
        <div className="flex items-center space-x-4">
          {bestTime !== null && (
            <div className="text-yellow-300 font-mono">
              <span className="mr-2 font-bold">BÄSTA TID:</span>
              {formatTime(bestTime)}
            </div>
          )}
          
          {gameState === 'playing' && (
            <Timer 
              initialTime={0}
              isRunning={gameState === 'playing'}
              onTimeUpdate={handleTimeUpdate}
            />
          )}
        </div>
      </div>

      {/* Main game area */}
      <div className="relative flex-grow">
        <Gokart />
        
        {/* Finish line button (temporary) - replace with actual game logic */}
        {gameState === 'playing' && (
          <button
            onClick={handleFinish}
            className="absolute bottom-4 right-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Målgång (Tillfällig knapp)
          </button>
        )}
        
        {/* Game overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-6">Go-Kart Race</h2>
            <p className="mb-8 text-lg">Kör runt banan så snabbt du kan!</p>
            <button 
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
            >
              Starta Lopp
            </button>
          </div>
        )}
        
        {gameState === 'finished' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-2 text-green-500">Målgång!</h2>
            <p className="text-2xl mb-2">Din tid: <span className="font-mono font-bold">{formatTime(currentTime)}</span></p>
            
            {bestTime === currentTime && (
              <p className="text-xl text-yellow-300 mb-6">Nytt rekord!</p>
            )}
            
            <button 
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg mt-4"
            >
              Kör Igen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameController;