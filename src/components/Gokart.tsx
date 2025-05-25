import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import GoKartSprite from "./GoKartSprite";
import RaceTrack from "../assets/RaceTrack";

interface Position {
  x: number;
  y: number;
  rotation: number;
}

interface KeyState {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
}

interface Boundaries {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface GokartProps {
  isGameActive?: boolean;
  onPositionUpdate?: (position: { x: number; y: number }) => void;
}

interface GokartRefHandle {
  handleControlPress: (key: string, isPressed: boolean) => void;
  updateBoundaries: (boundaries: Boundaries) => void;
}

const START_POSITION: Position = {
  x: 440,
  y: 90,
  rotation: 270,
};

const Gokart = forwardRef<GokartRefHandle, GokartProps>((props, ref) => {
  const { isGameActive = false, onPositionUpdate } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const rectangleSize = { width: 64, height: 64 };

  const [position, setPosition] = useState<Position>(START_POSITION);
  const [baseSpeed] = useState<number>(6);
  const [isOnTrack, setIsOnTrack] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(START_POSITION.rotation);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(baseSpeed);
  const [acceleration] = useState<number>(0.15);
  const [deceleration] = useState<number>(0.08);
  const [rotationSpeed] = useState<number>(3);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const [shakeFactor, setShakeFactor] = useState<number>(0);

  const GRASS_SPEED_FACTOR = 0.3;
  const GRASS_ROTATION_FACTOR = 0.7;
  const GRASS_DRAG = 1.2;
  const MAX_SHAKE = 2;

  const [boundaries, setBoundaries] = useState<Boundaries>({
    minX: 0,
    maxX: 896 - rectangleSize.width,
    minY: 0,
    maxY: 600 - rectangleSize.height,
  });

  const captureTrackImage = useCallback(() => {
    const canvas = backgroundCanvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 896;
    canvas.height = 600;

    const svgElement = container.querySelector("svg");
    if (!svgElement) {
      setTimeout(captureTrackImage, 200);
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 896, 600);
        URL.revokeObjectURL(svgUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    } catch (error) {
      // Silent error handling
    }
  }, []);

  useEffect(() => {
    if (isGameActive) {
      setTimeout(captureTrackImage, 100);
    }
  }, [isGameActive, captureTrackImage]);

  const isGrassColor = (r: number, g: number, b: number): boolean => {
    const isGreenDominant = g > r * 1.3 && g > b * 1.3;

    const grassR = 42,
      grassG = 146,
      grassB = 44;
    const colorDistance = Math.sqrt(
      Math.pow(r - grassR, 2) +
        Math.pow(g - grassG, 2) +
        Math.pow(b - grassB, 2)
    );

    return isGreenDominant || colorDistance < 50;
  };

  const sampleColorAtPoint = (
    x: number,
    y: number
  ): { r: number; g: number; b: number } | null => {
    const canvas = backgroundCanvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) return null;

    try {
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        return { r: pixel[0], g: pixel[1], b: pixel[2] };
      }
    } catch (error) {
      // Silent error handling
    }

    return null;
  };

  const isPositionOnTrack = (x: number, y: number): boolean => {
    const kartCenterX = Math.floor(x + rectangleSize.width / 2);
    const kartCenterY = Math.floor(y + rectangleSize.height / 2);

    const samplePoints = [
      { x: kartCenterX, y: kartCenterY, weight: 3 },
      { x: kartCenterX, y: kartCenterY - 12, weight: 2 },
      { x: kartCenterX + 12, y: kartCenterY, weight: 2 },
      { x: kartCenterX, y: kartCenterY + 12, weight: 2 },
      { x: kartCenterX - 12, y: kartCenterY, weight: 2 },
      { x: kartCenterX + 8, y: kartCenterY - 8, weight: 1 },
      { x: kartCenterX + 8, y: kartCenterY + 8, weight: 1 },
      { x: kartCenterX - 8, y: kartCenterY + 8, weight: 1 },
      { x: kartCenterX - 8, y: kartCenterY - 8, weight: 1 },
    ];

    let totalWeight = 0;
    let trackWeight = 0;

    for (const point of samplePoints) {
      const color = sampleColorAtPoint(point.x, point.y);

      if (color) {
        totalWeight += point.weight;

        if (!isGrassColor(color.r, color.g, color.b)) {
          trackWeight += point.weight;
        }
      }
    }

    const trackPercentage =
      totalWeight > 0 ? (trackWeight / totalWeight) * 100 : 50;

    return trackPercentage >= 60;
  };

  useEffect(() => {
    if (isGameActive) {
      setPosition(START_POSITION);
      setRotation(START_POSITION.rotation);
      setCurrentSpeed(0);
    }
  }, [isGameActive]);

  const keyState = useRef<KeyState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  useImperativeHandle(ref, () => ({
    handleControlPress: (key: string, isPressed: boolean) => {
      if (key in keyState.current) {
        keyState.current[key as keyof KeyState] = isPressed;
      }
    },
    updateBoundaries: (newBoundaries: Boundaries) => {
      setBoundaries(newBoundaries);
    },
  }));

  useEffect(() => {
    const checkFocus = () => {
      if (document.activeElement === containerRef.current) {
        setIsFocused(true);
      } else {
        let element = containerRef.current?.parentElement;
        let parentHasFocus = false;

        while (element) {
          if (element === document.activeElement) {
            parentHasFocus = true;
            break;
          }
          element = element.parentElement;
        }

        setIsFocused(parentHasFocus);
      }
    };

    checkFocus();
    const handleFocusIn = () => checkFocus();
    const handleFocusOut = () => checkFocus();

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  useEffect(() => {
    if (!isOnTrack && currentSpeed > 2) {
      const shake = () => {
        setShakeFactor(Math.random() * MAX_SHAKE * (currentSpeed / baseSpeed));
      };
      const shakeInterval = setInterval(shake, 100);
      return () => {
        clearInterval(shakeInterval);
        setShakeFactor(0);
      };
    } else {
      setShakeFactor(0);
    }
  }, [isOnTrack, currentSpeed, baseSpeed]);

  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      if ((isFocused || isGameActive) && isGameActive) {
        setRotation((prevRotation) => {
          let newRotation = prevRotation;

          const effectiveRotationSpeed = isOnTrack
            ? rotationSpeed
            : rotationSpeed * GRASS_ROTATION_FACTOR;

          if (keyState.current.ArrowLeft) {
            newRotation = newRotation - effectiveRotationSpeed;
          }
          if (keyState.current.ArrowRight) {
            newRotation = newRotation + effectiveRotationSpeed;
          }

          return newRotation;
        });

        setCurrentSpeed((prevSpeed) => {
          let newSpeed = prevSpeed;

          const terrainSpeedFactor = isOnTrack ? 1 : GRASS_SPEED_FACTOR;
          const terrainDragFactor = isOnTrack ? 1 : GRASS_DRAG;

          setMaxSpeed(baseSpeed * terrainSpeedFactor);

          if (keyState.current.ArrowUp) {
            newSpeed += acceleration * terrainSpeedFactor;
          } else if (keyState.current.ArrowDown) {
            newSpeed -= acceleration * terrainSpeedFactor;
          } else {
            if (newSpeed > 0) {
              newSpeed -= deceleration * terrainDragFactor;
            } else if (newSpeed < 0) {
              newSpeed += deceleration * terrainDragFactor;
            }

            if (Math.abs(newSpeed) < 0.1) {
              newSpeed = 0;
            }
          }

          newSpeed = Math.min(maxSpeed, Math.max(-maxSpeed * 0.6, newSpeed));

          return newSpeed;
        });

        setPosition((prev) => {
          const radians = (rotation * Math.PI) / 180;

          const deltaX = Math.sin(radians) * currentSpeed;
          const deltaY = -Math.cos(radians) * currentSpeed;

          let newX =
            prev.x +
            deltaX +
            (isOnTrack ? 0 : (Math.random() - 0.5) * shakeFactor);
          let newY =
            prev.y +
            deltaY +
            (isOnTrack ? 0 : (Math.random() - 0.5) * shakeFactor);

          newX = Math.max(boundaries.minX, Math.min(boundaries.maxX, newX));
          newY = Math.max(boundaries.minY, Math.min(boundaries.maxY, newY));

          const onTrack = isPositionOnTrack(newX, newY);
          setIsOnTrack(onTrack);

          if (onPositionUpdate) {
            onPositionUpdate({ x: newX, y: newY });
          }

          return {
            x: newX,
            y: newY,
            rotation: rotation,
          };
        });
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();

        if (e.key in keyState.current) {
          keyState.current[e.key as keyof KeyState] = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.key in keyState.current) {
        keyState.current[e.key as keyof KeyState] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    rotation,
    currentSpeed,
    maxSpeed,
    isFocused,
    boundaries,
    isGameActive,
    onPositionUpdate,
    isOnTrack,
    shakeFactor,
  ]);

  const renderTerrainEffects = () => {
    if (!isOnTrack && currentSpeed > 1) {
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute"
            style={{
              left: `${position.x + 32}px`,
              top: `${position.y + 32}px`,
              zIndex: 10,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-yellow-100 rounded-full opacity-40 animate-ping"
                style={{
                  width: `${3 + Math.random() * 4}px`,
                  height: `${3 + Math.random() * 4}px`,
                  left: `${(Math.random() - 0.5) * 30}px`,
                  top: `${(Math.random() - 0.5) * 30}px`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  animationDelay: `${Math.random() * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleContainerClick = () => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white border border-gray-300 rounded-lg overflow-hidden"
      tabIndex={0}
      style={{ outline: "none", width: "896px", height: "600px" }}
      onClick={handleContainerClick}
    >
      {/* Hidden canvas for color sampling */}
      <canvas
        ref={backgroundCanvasRef}
        width="896"
        height="600"
        style={{ display: "none" }}
      />

      {/* Race track as background */}
      <RaceTrack className="absolute top-0 left-0 w-full h-full pointer-events-none" />

      {/* Visual effects for terrain */}
      {renderTerrainEffects()}

      {/* Go-kart sprite on top */}
      <GoKartSprite
        x={position.x}
        y={position.y}
        rotation={position.rotation}
      />
    </div>
  );
});

Gokart.displayName = "Gokart";

export default Gokart;
