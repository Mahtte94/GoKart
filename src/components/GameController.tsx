import React, { useState, useCallback, useRef, useEffect } from 'react';
import Gokart from './Gokart';
import Timer from './Timer';

type GameState = 'ready' | 'playing' | 'gameover';

const GameController: React.FC = () => {
  const DEFAULT_TIME_LIMIT = 60;
  
  const [gameState, setGameState] = useState<GameState>('ready');
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimeUp = useCallback(() => {
    setGameState('gameover');
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    setTimeLimit(DEFAULT_TIME_LIMIT);
    
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
  }, [DEFAULT_TIME_LIMIT]);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col"
      tabIndex={-1}
    >
      {/* Game header with timer */}
      <div className="flex justify-between items-center mb-2 px-2">
        <h2 className="text-xl font-bold text-white">Go-Kart Race</h2>
        
        {gameState === 'playing' && (
          <Timer 
            initialTime={timeLimit} 
            onTimeUp={handleTimeUp} 
            isPaused={gameState !== 'playing'} 
          />
        )}
      </div>

      {/* Main game area */}
      <div className="relative flex-grow">
        <Gokart />
        
        {/* Game overlay for different states */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-6">Go-Kart Race</h2>
            <p className="mb-8 text-lg">Race against the clock! Complete the course before time runs out.</p>
            <button 
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
            >
              Start Race
            </button>
          </div>
        )}
        
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
            <h2 className="text-3xl font-bold mb-6 text-red-500">Time's Up!</h2>
            <p className="mb-8 text-lg">You ran out of time. Try again!</p>
            <button 
              onClick={restartGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
            >
              Restart Race
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameController;