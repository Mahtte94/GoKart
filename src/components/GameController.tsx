import React, { useState, useCallback, useRef, useEffect } from "react";
import Gokart from "./Gokart";
import Timer from "./Timer";
import LapIndicator from "./LapIndicator";
import FinishLine from "./FinishLine";
import Checkpoint from "./Checkpoint";
import DebugOverlay from "./DebugOverlay";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flag,
  CheckCircle,
} from "lucide-react";
import MobileControls from "./MobileControls";
import TivoliApiService from "../api/TivoliApiService";

type GameState = "ready" | "playing" | "gameover" | "finished";

// Define the interface for the Gokart component ref
interface GokartRefHandle {
  handleControlPress: (key: string, isPressed: boolean) => void;
  getTerrainInfo: () => boolean;
}

// Updated checkpoint positions to fit the 896x600 size
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
  },
];

// Finish line at the top of the track
const FINISH_LINE = {
  x: 448, // Original position from first screenshot
  y: 104,
  width: 20,
  height: 100,
};

// Total number of laps to complete
const TOTAL_LAPS = 3;

const GameController: React.FC = () => {
  // Game state and timing
  const [gameState, setGameState] = useState<GameState>("ready");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  // Game progression
  const [currentLap, setCurrentLap] = useState<number>(0);
  const [totalLaps] = useState<number>(TOTAL_LAPS);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const checkpointsPassedRef = useRef<boolean[]>([false, false]);
  const canCountLapRef = useRef<boolean>(false);
  const [isOnTrack, setIsOnTrack] = useState<boolean>(true);

  // Kart physics data
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(8);

  // UI and debugging
  const [showDebug, setShowDebug] = useState<boolean>(true);
  const [checkpointsVisible, setCheckpointsVisible] = useState<boolean>(true);
  const [gameKey, setGameKey] = useState<number>(0); // Used to reset the game

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const gokartRef = useRef<GokartRefHandle>(null);

  // Update time when Timer component updates
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Handle race completion
  const handleFinish = useCallback(() => {
    setGameState("finished");

    // Update best time if current is better
    if (bestTime === null || currentTime < bestTime) {
      setBestTime(currentTime);
    }
  }, [currentTime, bestTime]);

  // Track go-kart position and handle checkpoint/lap tracking
  const handlePositionUpdate = useCallback(
    (position: { x: number; y: number }) => {
      // Store the last position
      lastPositionRef.current = position;

      // Update terrain info from the kart component
      if (gokartRef.current) {
        setIsOnTrack(gokartRef.current.getTerrainInfo());
      }

      // Debug position info
      if (showDebug) {
        console.log(`Position: x=${Math.round(position.x)}, y=${Math.round(
          position.y
        )}, 
        Checkpoints: [${checkpointsPassedRef.current.join(", ")}], 
        Can count lap: ${canCountLapRef.current}`);
      }

      // Detect finish line crossing
      const isOnFinishLine =
        position.x >= FINISH_LINE.x - FINISH_LINE.width / 2 &&
        position.x <= FINISH_LINE.x + FINISH_LINE.width / 2 &&
        position.y <= FINISH_LINE.y + FINISH_LINE.height;

      // Check each checkpoint
      CHECKPOINTS.forEach((checkpoint, index) => {
        const distanceToCheckpoint = Math.sqrt(
          Math.pow(position.x - checkpoint.x, 2) +
            Math.pow(position.y - checkpoint.y, 2)
        );

        // If kart is within checkpoint radius and it hasn't been passed yet
        if (
          distanceToCheckpoint <= checkpoint.radius &&
          !checkpointsPassedRef.current[index]
        ) {
          checkpointsPassedRef.current[index] = true;
          console.log(`Checkpoint ${index + 1} passed!`);
        }
      });

      // Check if all checkpoints have been passed
      const allCheckpointsPassed = checkpointsPassedRef.current.every(
        (passed) => passed
      );

      // Count a lap when crossing finish line after all checkpoints
      if (isOnFinishLine && allCheckpointsPassed && canCountLapRef.current) {
        setCurrentLap((prev) => {
          const newLap = prev + 1;
          console.log(`Lap completed! New lap: ${newLap}`);

          // If all laps are completed, end the game
          if (newLap >= totalLaps) {
            handleFinish();
          }
          return newLap;
        });

        // Reset checkpoint status and temporarily disable lap counting
        checkpointsPassedRef.current = [false, false];
        canCountLapRef.current = false;

        // After a delay, re-enable lap counting
        setTimeout(() => {
          canCountLapRef.current = true;
        }, 1000);
      }
    },
    [handleFinish, totalLaps, showDebug]
  );

  // Receive speed updates from the Gokart component
  const handleSpeedUpdate = useCallback(
    (speed: number, maxSpeedValue: number) => {
      setCurrentSpeed(speed);
      setMaxSpeed(maxSpeedValue);
    },
    []
  );

  // Start/restart the game
  const startGame = useCallback(() => {
    // Try to buy ticket (pay fee)
    TivoliApiService.reportSpin()
      .then(() => {
        console.log("Spin (start fee) reported successfully");
        // If successful, start the game
        setGameState("playing");
        setCurrentTime(0);
        setCurrentLap(0);
        setGameKey((prevKey) => prevKey + 1); // Force Gokart component to reset
        checkpointsPassedRef.current = [false, false];
        canCountLapRef.current = false;

        setTimeout(() => {
          canCountLapRef.current = true;
        }, 1500);

        if (containerRef.current) containerRef.current.focus();
      })
      .catch((error) => {
        console.error("Failed to start game:", error);
        alert(
          "Något gick fel när du skulle starta spelet – försök igen via Tivoli."
        );
      });
  }, []);

  // Format time for display
  const formatTime = useCallback((seconds: number | null): string => {
    if (seconds === null) return "--:--";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;

    return `${minsStr}:${secsStr}`;
  }, []);

  useEffect(() => {
    const checkMobileAndOrientation = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobile && isPortraitMode);
    };

    checkMobileAndOrientation();
    window.addEventListener("resize", checkMobileAndOrientation);
    window.addEventListener("orientationchange", () =>
      setTimeout(checkMobileAndOrientation, 200)
    );

    return () => {
      window.removeEventListener("resize", checkMobileAndOrientation);
      window.removeEventListener(
        "orientationchange",
        checkMobileAndOrientation
      );
    };
  }, []);

  const OrientationOverlay = () => (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex flex-col justify-center items-center text-center px-6">
      <h2 className="text-white text-2xl font-bold mb-4">Rotera enheten</h2>
      <p className="text-white text-lg">
        Vrid din mobil till liggande läge för att spela spelet.
      </p>
    </div>
  );

  // Handle keyboard debug toggles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        setShowDebug((prev) => !prev);
      }
      if (e.key === "c" || e.key === "C") {
        setCheckpointsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check if mobile view and calculate scale
  useEffect(() => {
    const checkMobileAndScale = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);

      if (isMobile) {
        // Calculate scale factor for mobile
        const gameWidth = 896;
        const gameHeight = 600;
        const headerHeight = 50; // Header height
        const controlsHeight = 100; // Space for mobile controls
        const safePadding = 20; // Safe area padding

        const availableWidth = window.innerWidth - safePadding;
        const availableHeight =
          window.innerHeight - headerHeight - controlsHeight - safePadding;

        const scaleX = availableWidth / gameWidth;
        const scaleY = availableHeight / gameHeight;
        const scale = Math.min(scaleX, scaleY, 0.9); // Cap at 90% to ensure controls are visible

        // Set CSS variable for scale
        document.documentElement.style.setProperty(
          "--scale-factor",
          scale.toString()
        );

        console.log(
          `Mobile scaling: ${scale} (${window.innerWidth}x${window.innerHeight})`
        );
      } else {
        // Reset scale for desktop
        document.documentElement.style.setProperty("--scale-factor", "1");
      }
    };

    checkMobileAndScale();
    window.addEventListener("resize", checkMobileAndScale);
    window.addEventListener("orientationchange", () => {
      setTimeout(checkMobileAndScale, 200); // Increased delay for orientation change
    });

    return () => {
      window.removeEventListener("resize", checkMobileAndScale);
      window.removeEventListener("orientationchange", checkMobileAndScale);
    };
  }, []);

  // Handle game controls
  const handleControlPress = (
    key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
    isPressed: boolean
  ) => {
    if (gokartRef.current) {
      gokartRef.current.handleControlPress(key, isPressed);
    }
  };

  // Control instructions component
  const ControlInstructions = () => (
    <div className="flex flex-col items-center mb-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-3 text-lg">
        Tangentbordskontroller:
      </h3>
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
        <p>
          Kör runt banan och passera alla checkpoints innan du korsar mållinjen
          igen för att räkna ett varv.
        </p>
        <p>Kör {TOTAL_LAPS} varv för att avsluta loppet.</p>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="game-wrapper relative" tabIndex={-1}>
      {/* Game header with timer */}
      <div className="game-header flex justify-between items-center p-2 md:p-3 bg-gray-800">
        <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white">
          Go-Kart Race
        </h2>

        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          {bestTime !== null && (
            <div className="text-yellow-300 font-mono text-xs sm:text-sm md:text-base">
              <span className="mr-1 md:mr-2 font-bold hidden sm:inline">
                BÄSTA TID:
              </span>
              <span className="mr-1 md:mr-2 font-bold sm:hidden">BÄST:</span>
              {formatTime(bestTime)}
            </div>
          )}

          {gameState === "playing" && (
            <>
              <LapIndicator currentLap={currentLap} totalLaps={totalLaps} />
              <Timer
                initialTime={0}
                isRunning={gameState === "playing"}
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
              isGameActive={gameState === "playing"}
              onPositionUpdate={handlePositionUpdate}
              onSpeedUpdate={handleSpeedUpdate}
            />

            {/* Finish line */}
            <FinishLine position={{ x: FINISH_LINE.x, y: FINISH_LINE.y }} />

            {/* Show checkpoints if visible */}
            {checkpointsVisible &&
              gameState === "playing" &&
              CHECKPOINTS.map((checkpoint, index) => (
                <Checkpoint
                  key={checkpoint.id}
                  position={{ x: checkpoint.x, y: checkpoint.y }}
                  isPassed={checkpointsPassedRef.current[index]}
                  index={index + 1}
                />
              ))}

            {/* Debug overlay */}
            {showDebug && gameState === "playing" && (
              <DebugOverlay
                position={lastPositionRef.current}
                checkpointsPassed={checkpointsPassedRef.current}
                currentLap={currentLap}
                canCountLap={canCountLapRef.current}
                isOnTrack={isOnTrack}
                currentSpeed={currentSpeed}
                maxSpeed={maxSpeed}
              />
            )}

            {/* Game overlays */}
            {gameState === "ready" && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 p-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
                  Go-Kart Race
                </h2>
                <p className="text-base sm:text-lg mb-1 text-white text-center">
                  Kör {totalLaps} varv runt banan så snabbt du kan!
                </p>
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
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
                >
                  Starta Lopp
                </button>
              </div>
            )}

            {gameState === "finished" && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 p-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-green-500">
                  <Flag className="inline-block mr-2 mb-1" size={28} />
                  Målgång!
                </h2>
                <p className="text-lg sm:text-xl mb-1 text-white">
                  Du klarade alla {totalLaps} varv!
                </p>
                <p className="text-lg sm:text-xl mb-4 text-white">
                  Din tid:{" "}
                  <span className="font-mono font-bold">
                    {formatTime(currentTime)}
                  </span>
                </p>

                {bestTime === currentTime && (
                  <div className="bg-yellow-600 px-4 py-2 rounded-lg mb-4">
                    <p className="text-lg sm:text-xl text-yellow-300 font-bold">
                      Nytt rekord!
                    </p>
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

          {/* Mobile controls - positioned absolutely within game area */}
          {isMobileView && !isPortrait && gameState === "playing" && (
            <div className="mobile-controls-wrapper">
              <div className="mobile-controls-container">
                <MobileControls onControlPress={handleControlPress} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help text - hide on mobile */}
      <div className="bg-gray-800 p-2 text-white text-xs hidden md:block flex-shrink-0">
        <p>
          Press <kbd className="bg-gray-700 px-1 rounded">D</kbd> to toggle
          debug overlay. Press <kbd className="bg-gray-700 px-1 rounded">C</kbd>{" "}
          to toggle checkpoint visibility.
        </p>
      </div>
      {isPortrait && <OrientationOverlay />}
    </div>
  );
};

export default GameController;
