import React, { useState, useCallback, useRef, useEffect } from "react";
import Gokart from "./Gokart";
import Timer from "./Timer";
import LapIndicator from './LapIndicator';
import FinishLine from './FinishLine';
import Checkpoint from './Checkpoint';
import DebugOverlay from './DebugOverlay';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flag, CheckCircle } from "lucide-react";
import MobileControls from "./MobileControls";

type GameState = 'ready' | 'playing' | 'gameover' | 'finished';

// Uppdaterade checkpoint-positioner baserade på banan
const CHECKPOINTS = [
  {
    id: 1,
    x: 204,
    y: 380,
    radius: 100,
  },
  {
    id: 2,
    x: 691, // Höger kurva på banan
    y: 400,
    radius: 100,
  }
];

// Mållinjen överst på banan
const FINISH_LINE = {
  x: 440, // Position på x-axeln
  y: 0,   // Position på y-axeln (0 för att vara vid toppen)
  width: 80, 
  height: 100, 
};

// Konstant för antalet varv
const TOTAL_LAPS = 3;

const GameController: React.FC = () => {
  // Spelstatus och tidshantering
  const [gameState, setGameState] = useState<GameState>("ready");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  
  // Spelförlopp
  const [currentLap, setCurrentLap] = useState<number>(0);
  const [totalLaps] = useState<number>(TOTAL_LAPS);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const checkpointsPassedRef = useRef<boolean[]>([false, false]);
  const canCountLapRef = useRef<boolean>(false);
  
  // UI och debugging
  const [showDebug, setShowDebug] = useState<boolean>(true);
  const [checkpointsVisible, setCheckpointsVisible] = useState<boolean>(true);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const gokartRef = useRef<{ handleControlPress: (key: string, isPressed: boolean) => void }>(null);

  // Uppdatera tiden när Timer-komponenten uppdaterar
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Hantera målgång
  const handleFinish = useCallback(() => {
    setGameState("finished");

    // Uppdatera bästa tid om den nuvarande är bättre
    if (bestTime === null || currentTime < bestTime) {
      setBestTime(currentTime);
    }
  }, [currentTime, bestTime]);

  // Spåra go-kartens position och hantera checkpoint/varvräkning
  const handlePositionUpdate = useCallback((position: { x: number; y: number }) => {
    // Spara senaste positionen
    lastPositionRef.current = position;
    
    // Kontrollera om karten är på mållinjen
    const isOnFinishLine = 
      position.x >= FINISH_LINE.x - FINISH_LINE.width / 2 &&
      position.x <= FINISH_LINE.x + FINISH_LINE.width / 2 &&
      position.y >= FINISH_LINE.y - 5 &&
      position.y <= FINISH_LINE.y + FINISH_LINE.height;
    
    // Kontrollera checkpoints
    CHECKPOINTS.forEach((checkpoint, index) => {
      const distanceToCheckpoint = Math.sqrt(
        Math.pow(position.x - checkpoint.x, 2) + 
        Math.pow(position.y - checkpoint.y, 2)
      );
      
      // Om karten är inom checkpoint-området och den inte redan är markerad som passerad
      if (distanceToCheckpoint <= checkpoint.radius && !checkpointsPassedRef.current[index]) {
        checkpointsPassedRef.current[index] = true;
        console.log(`Checkpoint ${index + 1} passerad!`);
      }
    });
    
    // Kontrollera om alla checkpoints är passerade
    const allCheckpointsPassed = checkpointsPassedRef.current.every(passed => passed);
    
    // Räkna ett varv när karten korsar mållinjen efter att alla checkpoints passerats
    if (isOnFinishLine && allCheckpointsPassed && canCountLapRef.current) {
      setCurrentLap(prev => {
        const newLap = prev + 1;
        console.log(`Varv avklarat! Nytt varv: ${newLap}`);
        
        // Om alla varv är körda, avsluta spelet
        if (newLap >= totalLaps) {
          handleFinish();
        }
        return newLap;
      });
      
      // Återställ checkpoint-status och inaktivera varvräkning tillfälligt
      checkpointsPassedRef.current = [false, false];
      canCountLapRef.current = false;
      
      // Efter en fördröjning, aktivera varvräkning igen
      setTimeout(() => {
        canCountLapRef.current = true;
      }, 1000);
    }
  }, [handleFinish, totalLaps]);

  // Starta/starta om spelet
  const startGame = useCallback(() => {
    setGameState("playing");
    setCurrentTime(0);
    setCurrentLap(0);
    
    // Återställ checkpoint-status
    checkpointsPassedRef.current = [false, false];
    
    // Aktivera varvräkning efter en kort fördröjning så att spelaren kan köra iväg från mållinjen
    canCountLapRef.current = false;
    setTimeout(() => {
      canCountLapRef.current = true;
    }, 1500); // 1.5 sekunder bör räcka för att köra bort från mållinjen
    
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

  // Formatera tid för visning
  const formatTime = useCallback((seconds: number | null): string => {
    if (seconds === null) return "--:--";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;

    return `${minsStr}:${secsStr}`;
  }, []);

  // Hantera tangentbordskontroller
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') {
        setShowDebug(prev => !prev);
      } else if (e.key.toLowerCase() === 'c') {
        setCheckpointsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Kontrollera om visningsläget är mobilt
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Hantera spelkontroller
  const handleControlPress = (
    key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
    isPressed: boolean
  ) => {
    if (gokartRef.current) {
      gokartRef.current.handleControlPress(key, isPressed);
    }
  };

  // Tangentbordsinstruktioner-komponent
  const ControlInstructions = () => (
    <div className="flex flex-col items-center mb-6 bg-gray-800 bg-opacity-90 p-6 rounded-lg">
      <h3 className="text-white font-bold mb-4 text-xl">Tangentbordskontroller:</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
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
      <div className="mt-4 text-gray-300 text-sm">
        <p>Kör runt banan och passera alla checkpoints innan du korsar mållinjen igen för att räkna ett varv.</p>
        <p>Kör {TOTAL_LAPS} varv för att avsluta loppet.</p>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-gray-900"
      tabIndex={-1}
    >
      {/* Spelrubrik med timer och varvräknare */}
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
              <LapIndicator 
                currentLap={currentLap} 
                totalLaps={totalLaps} 
              />
              <Timer 
                initialTime={0}
                isRunning={gameState === 'playing'}
                onTimeUpdate={handleTimeUpdate}
              />
            </>
          )}
        </div>
      </div>

      {/* Huvudspelområde */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="relative">
            {/* Go-Kart-komponent med refs och positionsspårning */}
            <Gokart 
              ref={gokartRef}
              isGameActive={gameState === 'playing'}
              onPositionUpdate={handlePositionUpdate}
            />
            
            {/* Visa mållinje */}
            <FinishLine position={{ x: FINISH_LINE.x, y: FINISH_LINE.y }} />
            
            {/* Visa checkpoints om de är synliga */}
            {checkpointsVisible && gameState === 'playing' && (
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
            
            {/* Visa debug-overlay om aktiverad */}
            {showDebug && gameState === 'playing' && (
              <DebugOverlay 
                position={lastPositionRef.current}
                checkpointsPassed={checkpointsPassedRef.current}
                currentLap={currentLap}
                canCountLap={canCountLapRef.current}
              />
            )}

            {/* Mobilkontroller för pekskärmar */}
            {isMobileView && gameState === 'playing' && (
              <div className="absolute bottom-4 left-0 right-0 z-10">
                <MobileControls onControlPress={handleControlPress} />
              </div>
            )}

            {/* Spelöverlägg */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                <h2 className="text-4xl font-bold mb-6 text-white">Go-Kart Race</h2>
                <p className="text-xl mb-6 text-white">Kör runt banan så snabbt du kan!</p>
                
                {/* Tangentbordskontroll-instruktioner */}
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
                <h2 className="text-4xl font-bold mb-4 text-green-500">Målgång!</h2>
                <p className="text-2xl mb-4 text-white">Din tid: <span className="font-mono font-bold">{formatTime(currentTime)}</span></p>
                
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
      
      {/* Hjälptext */}
      <div className="bg-gray-800 p-2 text-white text-xs">
        <p>Tryck <kbd className="bg-gray-700 px-1 rounded">D</kbd> för att visa/dölja debug-overlay. 
           Tryck <kbd className="bg-gray-700 px-1 rounded">C</kbd> för att visa/dölja checkpoints.</p>
      </div>
    </div>
  );
};

export default GameController;