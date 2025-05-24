import React, { useState, useCallback, useRef, useEffect } from "react";
import Gokart from "./Gokart";
import Timer from "./Timer";
import LapIndicator from './LapIndicator';
import FinishLine from './FinishLine';
import Checkpoint from './Checkpoint';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flag, CheckCircle } from "lucide-react";
import MobileControls from "./MobileControls";

type GameState = 'ready' | 'playing' | 'gameover' | 'finished';

interface GokartRefHandle {
  handleControlPress: (key: string, isPressed: boolean) => void;
  updateBoundaries: (boundaries: { minX: number; maxX: number; minY: number; maxY: number }) => void;
}

const CHECKPOINTS = [
  {
    id: 1,
    x: 204,
    y: 420,
    radius: 80,
  },
  {
    id: 2,
    x: 580, 
    y: 474,
    radius: 80,
  }
];

const FINISH_LINE = {
  x: 448,
  y: 104, 
  width: 20, 
  height: 100, 
};

const TOTAL_LAPS = 3;

const GameController: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [currentScale, setCurrentScale] = useState<number>(1);
  
  const [currentLap, setCurrentLap] = useState<number>(0);
  const [totalLaps] = useState<number>(TOTAL_LAPS);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const checkpointsPassedRef = useRef<boolean[]>([false, false]);
  const canCountLapRef = useRef<boolean>(false);
  
  const [gameKey, setGameKey] = useState<number>(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gokartRef = useRef<GokartRefHandle>(null);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleFinish = useCallback(() => {
    setGameState("finished");

    if (bestTime === null || currentTime < bestTime) {
      setBestTime(currentTime);
    }
  }, [currentTime, bestTime]);

  const handlePositionUpdate = useCallback((position: { x: number; y: number }) => {
    lastPositionRef.current = position;
    
    const isOnFinishLine = 
      position.x >= FINISH_LINE.x - FINISH_LINE.width / 2 &&
      position.x <= FINISH_LINE.x + FINISH_LINE.width / 2 &&
      position.y <= FINISH_LINE.y + FINISH_LINE.height;
    
    CHECKPOINTS.forEach((checkpoint, index) => {
      const distanceToCheckpoint = Math.sqrt(
        Math.pow(position.x - checkpoint.x, 2) + 
        Math.pow(position.y - checkpoint.y, 2)
      );
      
      if (distanceToCheckpoint <= checkpoint.radius && !checkpointsPassedRef.current[index]) {
        checkpointsPassedRef.current[index] = true;
      }
    });
    
    const allCheckpointsPassed = checkpointsPassedRef.current.every(passed => passed);
    
    if (isOnFinishLine && allCheckpointsPassed && canCountLapRef.current) {
      setCurrentLap(prev => {
        const newLap = prev + 1;
        
        if (newLap >= totalLaps) {
          handleFinish();
        }
        return newLap;
      });
      
      checkpointsPassedRef.current = [false, false];
      canCountLapRef.current = false;
      
      setTimeout(() => {
        canCountLapRef.current = true;
      }, 1000);
    }
  }, [handleFinish, totalLaps]);

  const startGame = useCallback(() => {
    setGameState("playing");
    setCurrentTime(0);
    setCurrentLap(0);
    setGameKey(prevKey => prevKey + 1);
    
    checkpointsPassedRef.current = [false, false];
    
    canCountLapRef.current = false;
    setTimeout(() => {
      canCountLapRef.current = true;
    }, 1500);
    
    if (containerRef.current) {
      containerRef.current.focus();
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

  useEffect(() => {
    const checkMobileAndScale = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileView(isMobile);
      
      if (isMobile) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const gameWidth = 896;
        const gameHeight = 600;
        
        const headerHeight = 50;
        const controlsHeight = 55;
        const verticalPadding = 15;
        const horizontalPadding = 10;
        
        const reservedVertical = headerHeight + controlsHeight + verticalPadding;
        const reservedHorizontal = horizontalPadding;
        
        const availableWidth = viewportWidth - reservedHorizontal;
        const availableHeight = viewportHeight - reservedVertical;
        
        const scaleX = availableWidth / gameWidth;
        const scaleY = availableHeight / gameHeight;
        let scale = Math.min(scaleX, scaleY);
        
        const minScale = 0.4;
        const maxScale = 0.95;
        scale = Math.max(minScale, Math.min(maxScale, scale));
        
        setCurrentScale(scale);
        document.documentElement.style.setProperty('--scale-factor', scale.toString());

        if (gokartRef.current) {
          const kartSize = 64;
          gokartRef.current.updateBoundaries({
            minX: 0,
            maxX: gameWidth - kartSize,
            minY: 0,
            maxY: gameHeight - kartSize,
          });
        }
        
      } else {
        setCurrentScale(1);
        document.documentElement.style.setProperty('--scale-factor', '1');
        
        if (gokartRef.current) {
          gokartRef.current.updateBoundaries({
            minX: 0,
            maxX: 896 - 64,
            minY: 0,
            maxY: 600 - 64,
          });
        }
      }
    };
    
    checkMobileAndScale();
    
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobileAndScale, 100);
    };
    
    const handleOrientationChange = () => {
      setTimeout(checkMobileAndScale, 300);
    };
    
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const handleControlPress = (
    key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
    isPressed: boolean
  ) => {
    if (gokartRef.current) {
      gokartRef.current.handleControlPress(key, isPressed);
    }
  };

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
      
      <div className="mt-3 text-gray-300 text-sm">
        <p>Kör runt banan och passera alla checkpoints innan du korsar mållinjen igen för att räkna ett varv.</p>
        <p>Kör {TOTAL_LAPS} varv för att avsluta loppet.</p>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="game-wrapper"
      tabIndex={-1}
    >
      {/* Game header with timer */}
      <div className="game-header flex justify-between items-center p-2 md:p-3 bg-gray-800">
        <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white">Go-Kart Race</h2>
        
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          {bestTime !== null && (
            <div className="text-yellow-300 font-mono text-xs sm:text-sm md:text-base">
              <span className="mr-1 md:mr-2 font-bold hidden sm:inline">BÄSTA TID:</span>
              <span className="mr-1 md:mr-2 font-bold sm:hidden">BÄST:</span>
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

      {/* Main game area */}
      <div className="game-main">
        {/* Responsive container that scales based on viewport */}
        <div className="game-container-wrapper"> 
          <div className="relative game-container">
            {/* Main game elements */}
            <Gokart 
              key={gameKey}
              ref={gokartRef}
              isGameActive={gameState === 'playing'}
              onPositionUpdate={handlePositionUpdate}
            />
            
            {/* Finish line */}
            <FinishLine position={{ x: FINISH_LINE.x, y: FINISH_LINE.y }} />
            
            {/* Show checkpoints */}
            {gameState === 'playing' && CHECKPOINTS.map((checkpoint, index) => (
              <Checkpoint 
                key={checkpoint.id}
                position={{ x: checkpoint.x, y: checkpoint.y }} 
                isPassed={checkpointsPassedRef.current[index]}
                index={index + 1}
              />
            ))}
            
            {/* Game overlays */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 p-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Go-Kart Race</h2>
                <p className="text-base sm:text-lg mb-1 text-white text-center">Kör {totalLaps} varv runt banan så snabbt du kan!</p>
                <p className="text-xs sm:text-sm mb-4 text-yellow-300 flex items-center justify-center text-center">
                  <Flag size={14} className="inline mr-1" />
                  Du måste passera båda checkpoints
                  <CheckCircle size={14} className="inline mx-1" />
                  för att räkna ett varv!
                </p>
                
                {/* Keyboard control instructions - hide on mobile */}
                {!isMobileView && <ControlInstructions />}
                
                <button 
                  onClick={startGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Starta Lopp - 3€
                </button>
              </div>
            )}
            
            {gameState === 'finished' && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 p-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-green-500">
                  <Flag className="inline-block mr-2 mb-1" size={28} />
                  Målgång!
                </h2>
                <p className="text-lg sm:text-xl mb-1 text-white">Du klarade alla {totalLaps} varv!</p>
                <p className="text-lg sm:text-xl mb-4 text-white">Din tid: <span className="font-mono font-bold">{formatTime(currentTime)}</span></p>
                
                {bestTime === currentTime && (
                  <div className="bg-yellow-600 px-4 py-2 rounded-lg mb-4">
                    <p className="text-lg sm:text-xl text-yellow-300 font-bold">Nytt rekord!</p>
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
        
        {/* Mobile controls - positioned absolutely at bottom of main area */}
        {isMobileView && gameState === 'playing' && (
          <div className="mobile-controls-wrapper">
            <div className="mobile-controls-container">
              <MobileControls onControlPress={handleControlPress} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameController;