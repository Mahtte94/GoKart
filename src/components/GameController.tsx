import React, { useState, useCallback, useRef, useEffect } from "react";
import Gokart from "./Gokart";
import Timer from "./Timer";
import LapIndicator from "./LapIndicator";
import FinishLine from "./FinishLine";
import Checkpoint from "./Checkpoint";
import Leaderboard from "./Leaderboard";
import PlayerNameModal from "./PlayerNameModal";
import DebugPanel from "./DebugPanel"; // Import the debug panel
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flag,
  CheckCircle,
  Trophy,
  Settings,
  AlertCircle,
} from "lucide-react";
import MobileControls from "./MobileControls";
import TivoliApiService from "../api/TivoliApiService";
import JwtListener from "./JwtListener";
import { decodeJwt } from "./decodeUtil";

type GameState =
  | "ready"
  | "playing"
  | "gameover"
  | "finished"
  | "submitting-score";

interface GokartRefHandle {
  handleControlPress: (key: string, isPressed: boolean) => void;
  updateBoundaries: (boundaries: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }) => void;
}

interface MyTokenPayload {
  sub: string;
  name: string;
  exp: number;
  [key: string]: any;
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
  },
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
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [currentScale, setCurrentScale] = useState<number>(1);

  const [currentLap, setCurrentLap] = useState<number>(0);
  const [totalLaps] = useState<number>(TOTAL_LAPS);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const checkpointsPassedRef = useRef<boolean[]>([false, false]);
  const canCountLapRef = useRef<boolean>(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [waitingForToken, setWaitingForToken] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Leaderboard states
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showPlayerNameModal, setShowPlayerNameModal] =
    useState<boolean>(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState<boolean>(false);
  const [playerRank, setPlayerRank] = useState<number | undefined>(undefined);

  // Debug states
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);

  // Kart physics data
  const [gameKey, setGameKey] = useState<number>(0); // Used to reset the game

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const gokartRef = useRef<GokartRefHandle>(null);

  const [tivoliAuthStatus, setTivoliAuthStatus] = useState<string | null>(null);

  // Single useEffect for authentication handling
  useEffect(() => {
    const checkAuthentication = () => {
      console.log("[GameController] Checking authentication...");
      
      // Check URL parameters for token first
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");

      if (tokenFromUrl) {
        console.log("[GameController] Token found in URL");
        // Store token in localStorage
        localStorage.setItem("token", tokenFromUrl);

        // Validate token
        const decoded = decodeJwt<MyTokenPayload>(tokenFromUrl);
        if (decoded) {
          // Check if token is expired
          const currentTime = Math.floor(Date.now() / 1000);
          if (decoded.exp && decoded.exp < currentTime) {
            setTivoliAuthStatus("Token expired. Please login again.");
            setAuthError("Token has expired");
            localStorage.removeItem("token");
            setIsAuthenticated(false);
          } else {
            setTivoliAuthStatus("Authenticated with Tivoli (URL)");
            setAuthError(null);
            setIsAuthenticated(true);
          }
        } else {
          setTivoliAuthStatus("Invalid token from URL");
          setAuthError("Invalid token format");
          setIsAuthenticated(false);
        }
        return;
      }

      // Check localStorage for existing token
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        console.log("[GameController] Token found in localStorage");
        
        // Skip validation for test token
        if (storedToken === "test-token-for-development") {
          setTivoliAuthStatus("Test mode enabled");
          setAuthError(null);
          setIsAuthenticated(true);
          return;
        }

        const decoded = decodeJwt<MyTokenPayload>(storedToken);
        if (decoded) {
          // Check if token is expired
          const currentTime = Math.floor(Date.now() / 1000);
          if (decoded.exp && decoded.exp < currentTime) {
            setTivoliAuthStatus("Token expired. Please login again.");
            setAuthError("Stored token has expired");
            localStorage.removeItem("token");
            setIsAuthenticated(false);
          } else {
            setTivoliAuthStatus("Authenticated with Tivoli (stored)");
            setAuthError(null);
            setIsAuthenticated(true);
          }
        } else {
          setTivoliAuthStatus("Invalid stored token");
          setAuthError("Invalid stored token format");
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
        return;
      }

      // No token found
      const isInIframe = window.parent !== window;
      if (process.env.NODE_ENV === "development" && !isInIframe) {
        setTivoliAuthStatus("Development - awaiting authentication");
        setAuthError(null);
        setIsAuthenticated(false);
        setWaitingForToken(false);
      } else if (isInIframe) {
        setTivoliAuthStatus("Waiting for token from Tivoli...");
        setAuthError(null);
        setIsAuthenticated(false);
        setWaitingForToken(true);
      } else {
        setTivoliAuthStatus("Not launched from Tivoli");
        setAuthError("Game must be launched from Tivoli platform");
        setIsAuthenticated(false);
        setWaitingForToken(false);
      }
    };

    checkAuthentication();
  }, []);

  // Handler for when JwtListener receives a token
  const handleTokenReceived = (token: string) => {
    console.log("[GameController] Token received from JwtListener");
    const decoded = decodeJwt<MyTokenPayload>(token);
    if (decoded) {
      setIsAuthenticated(true);
      setAuthError(null);
      setWaitingForToken(false);
      setTivoliAuthStatus("Authenticated with Tivoli (postMessage)");
    } else {
      setTivoliAuthStatus("Invalid token from postMessage");
      setAuthError("Invalid token received");
      setIsAuthenticated(false);
      setWaitingForToken(false);
    }
  };

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleFinish = useCallback(() => {
    setGameState("finished");

    if (bestTime === null || currentTime < bestTime) {
      setBestTime(currentTime);
    }
  }, [currentTime, bestTime]);

  const handlePositionUpdate = useCallback(
    (position: { x: number; y: number }) => {
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

        if (
          distanceToCheckpoint <= checkpoint.radius &&
          !checkpointsPassedRef.current[index]
        ) {
          checkpointsPassedRef.current[index] = true;
        }
      });

      const allCheckpointsPassed = checkpointsPassedRef.current.every(
        (passed) => passed
      );

      if (isOnFinishLine && allCheckpointsPassed && canCountLapRef.current) {
        setCurrentLap((prev) => {
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
    },
    [handleFinish, totalLaps]
  );

  const startGame = useCallback(async (amount: number) => {
    console.log("[GameController] Starting game with amount:", amount);
    
    try {
      setGameState("playing");
      
      // Try to report the game transactions
      console.log("[GameController] Reporting spin (start fee)...");
      await TivoliApiService.reportSpin();
      console.log("[GameController] Spin reported successfully");

      console.log("[GameController] Reporting winnings...");
      await TivoliApiService.reportWinnings(amount);
      console.log("[GameController] Winnings reported successfully");

      console.log("[GameController] Awarding stamp...");
      await TivoliApiService.reportStamp();
      console.log("[GameController] Stamp awarded successfully");

      // Reset game state
      setCurrentTime(0);
      setCurrentLap(0);
      setGameKey((prevKey) => prevKey + 1); // Force Gokart to reset
      checkpointsPassedRef.current = [false, false];
      canCountLapRef.current = false;

      setTimeout(() => {
        canCountLapRef.current = true;
      }, 1500);

      if (containerRef.current) containerRef.current.focus();
      
    } catch (error) {
      console.error("[GameController] Failed to start game:", error);
      setGameState("ready"); // Reset to ready state on error
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      if (errorMessage.includes("Authentication required")) {
        setAuthError("Authentication expired. Please refresh the game from Tivoli.");
        setIsAuthenticated(false);
      } else {
        alert(`Något gick fel när du skulle starta spelet: ${errorMessage}`);
      }
    }
  }, []);

  const handleSubmitScore = useCallback(
    async (playerName: string) => {
      setIsSubmittingScore(true);
      try {
        const result = await TivoliApiService.submitScore(
          playerName,
          currentTime
        );
        setPlayerRank(result.rank);
        setShowPlayerNameModal(false);
        setShowLeaderboard(true);
        console.log(
          `Score submitted! Player rank: ${result.rank} out of ${result.total_players}`
        );
      } catch (error) {
        console.error("Failed to submit score:", error);
        alert("Kunde inte spara ditt resultat. Försök igen.");
      } finally {
        setIsSubmittingScore(false);
      }
    },
    [currentTime]
  );

  const handleSkipScoreSubmission = useCallback(() => {
    setShowPlayerNameModal(false);
    setShowLeaderboard(true);
  }, []);

  // Show player name modal when game finishes
  useEffect(() => {
    if (gameState === "finished") {
      // Small delay to let the finish animation play
      setTimeout(() => {
        setShowPlayerNameModal(true);
      }, 1500);
    }
  }, [gameState]);

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

  useEffect(() => {
    const checkMobileAndScale = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileView(isMobile);

      if (isMobile) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const gameWidth = 896;
        const gameHeight = 600;

        // Smaller header height for mobile
        const headerHeight = 40;
        const controlsHeight = 55;
        const verticalPadding = 15;
        const horizontalPadding = 10;

        const reservedVertical =
          headerHeight + controlsHeight + verticalPadding;
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
        document.documentElement.style.setProperty(
          "--scale-factor",
          scale.toString()
        );

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
        document.documentElement.style.setProperty("--scale-factor", "1");

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

    window.addEventListener("resize", debouncedResize);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
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

  // Debug functions for development
  const setTestToken = () => {
    localStorage.setItem('token', 'test-token-for-development');
    setIsAuthenticated(true);
    setAuthError(null);
    setTivoliAuthStatus("Test token set (development)");
    console.log("[GameController] Test token set");
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setTivoliAuthStatus("Token cleared");
    console.log("[GameController] Token cleared");
  };

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
      {/* JWT Listener for iframe communication */}
      <JwtListener onTokenReceived={handleTokenReceived} />
      
      {/* Orientation overlay for portrait mode */}
      {isPortrait && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex flex-col justify-center items-center text-center px-6">
          <h2 className="text-white text-2xl font-bold mb-4">Rotera enheten</h2>
          <p className="text-white text-lg">
            Vrid din mobil till liggande läge för att spela spelet.
          </p>
        </div>
      )}

      {/* Game header with timer */}
      <div className="game-header flex justify-between items-center p-2 md:p-3 bg-gray-800">
        <div className="flex items-center space-x-2">
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white">
            Go-Kart Race
          </h2>
          
          {/* Debug button for development */}
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => setShowDebugPanel(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-1 rounded"
              title="Debug Panel"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

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
            />

            {/* Finish line */}
            <FinishLine position={{ x: FINISH_LINE.x, y: FINISH_LINE.y }} />

            {/* Show checkpoints */}
            {gameState === "playing" &&
              CHECKPOINTS.map((checkpoint, index) => (
                <Checkpoint
                  key={checkpoint.id}
                  position={{ x: checkpoint.x, y: checkpoint.y }}
                  isPassed={checkpointsPassedRef.current[index]}
                  index={index + 1}
                />
              ))}

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

                {/* Authentication Error Display */}
                {authError && (
                  <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
                    <div className="text-red-300 text-sm">
                      <p className="font-semibold">Autentiseringsfel:</p>
                      <p>{authError}</p>
                    </div>
                  </div>
                )}

                {/* Keyboard control instructions - hide on mobile */}
                {!isMobileView && <ControlInstructions />}

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* View Leaderboard Button */}
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Topplista
                  </button>

                  {/* Start Game Button */}
                  <button
                    onClick={() => startGame(3)}
                    disabled={!isAuthenticated || waitingForToken}
                    className={`${
                      isAuthenticated && !waitingForToken
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-500 cursor-not-allowed"
                    } text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all duration-200`}
                  >
                    {waitingForToken 
                      ? "Ansluter till Tivoli..."
                      : isAuthenticated
                        ? "Starta Lopp: €3"
                        : "Starta spelet via Tivoli"}
                  </button>
                </div>

                {/* Development Tools */}
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-2">
                    <p className="text-xs text-gray-400 mb-2">
                      Development Tools:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={setTestToken}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Set Test Token
                      </button>
                      <button
                        onClick={clearToken}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Clear Token
                      </button>
                      <button
                        onClick={() => console.log(TivoliApiService.getDebugInfo())}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Log Debug Info
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Information */}
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">
                    Status Information:
                  </p>
                  <div className="text-xs text-gray-300 space-y-1">
                    <p>In iframe: {(window.parent !== window).toString()}</p>
                    <p>Waiting for token: {waitingForToken.toString()}</p>
                    <p>Authenticated: {isAuthenticated.toString()}</p>
                    <p>Token exists: {(!!localStorage.getItem("token")).toString()}</p>
                    <p>Status: {tivoliAuthStatus}</p>
                    <p>Environment: {process.env.NODE_ENV}</p>
                  </div>
                </div>
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

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg text-lg flex items-center justify-center"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Se Topplista
                  </button>

                  <button
                    onClick={() => startGame(3)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg"
                  >
                    Kör igen: €3
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile controls section - below game area */}
      {isMobileView && gameState === "playing" && (
        <div className="mobile-controls-section">
          <MobileControls onControlPress={handleControlPress} />
        </div>
      )}

      {/* Player Name Modal */}
      <PlayerNameModal
        isVisible={showPlayerNameModal}
        completionTime={currentTime}
        onSubmit={handleSubmitScore}
        onSkip={handleSkipScoreSubmission}
        isSubmitting={isSubmittingScore}
      />

      {/* Leaderboard Modal */}
      <Leaderboard
        isVisible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        playerRank={playerRank}
        currentPlayerTime={currentTime}
      />

      {/* Debug Panel */}
      <DebugPanel
        isVisible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
    </div>
  );
};

export default GameController;