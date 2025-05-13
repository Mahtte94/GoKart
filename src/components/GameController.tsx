import React, { useState, useCallback, useRef } from 'react';
import Gokart from './Gokart';
import Timer from './Timer';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

type GameState = 'ready' | 'playing' | 'gameover' | 'finished';

const GameController: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState<number>(0); // Lägg till en nyckel för att tvinga omrendering
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleFinish = useCallback(() => {
    setGameState('finished');
    
    if (bestTime === null || currentTime < bestTime) {
      setBestTime(currentTime);
    }
  }, [currentTime, bestTime]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setCurrentTime(0);
    setGameKey(prevKey => prevKey + 1); // Öka spelnyckeln för att tvinga omrendering av Gokart
    
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
    <div className="flex flex-col items-center mb-6 bg-gray-800 bg-opacity-90 p-6 rounded-lg">
      <h3 className="text-white font-bold mb-4 text-xl">Tangentbordskontroller:</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div></div>
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-lg p-2 w-14 h-14 flex items-center justify-center mb-2">
            <ArrowUp className="text-white w-8 h-8" />
          </div>
          <span className="text-white">Framåt</span>
        </div>
        <div></div>
        
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-lg p-2 w-14 h-14 flex items-center justify-center mb-2">
            <ArrowLeft className="text-white w-8 h-8" />
          </div>
          <span className="text-white">Vänster</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-lg p-2 w-14 h-14 flex items-center justify-center mb-2">
            <ArrowDown className="text-white w-8 h-8" />
          </div>
          <span className="text-white">Bakåt</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-gray-700 rounded-lg p-2 w-14 h-14 flex items-center justify-center mb-2">
            <ArrowRight className="text-white w-8 h-8" />
          </div>
          <span className="text-white">Höger</span>
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
            <Timer 
              initialTime={0}
              isRunning={gameState === 'playing'}
              onTimeUpdate={handleTimeUpdate}
            />
          )}
        </div>
      </div>

      {/* Main game area - centered with fixed height */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="relative">
            <Gokart 
              key={gameKey} // Använd gameKey för att tvinga omrendering
              isGameActive={gameState === 'playing'}
            />
            
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
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                <h2 className="text-4xl font-bold mb-6 text-white">Go-Kart Race</h2>
                <p className="text-xl mb-6 text-white">Kör runt banan så snabbt du kan!</p>
                
                {/* Keyboard control instructions */}
                <ControlInstructions />
                
                <button 
                  onClick={startGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl"
                >
                  Starta Lopp
                </button>
              </div>
            )}
            
            {gameState === 'finished' && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                <h2 className="text-4xl font-bold mb-4 text-green-500">Målgång!</h2>
                <p className="text-2xl mb-4 text-white">Din tid: <span className="font-mono font-bold">{formatTime(currentTime)}</span></p>
                
                {bestTime === currentTime && (
                  <p className="text-2xl text-yellow-300 mb-8">Nytt rekord!</p>
                )}
                
                <button 
                  onClick={startGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl mt-4"
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