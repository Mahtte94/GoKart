// Denna fil löser problemet med canvas är null genom att använda en tryggare TypeScript-implementering

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
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

// Define the ref type interface
interface GokartRefHandle {
  handleControlPress: (key: keyof KeyState, isPressed: boolean) => void;
}

const START_POSITION: Position = {
  x: 440, // Matchar FINISH_LINE.x
  y: 50,  // Strax under mållinjen för att undvika omedelbar lap-triggering
  rotation: 270, // Pekar nedåt
};

// Use forwardRef to expose methods to parent component
const Gokart = forwardRef<GokartRefHandle, GokartProps>((props, ref) => {
  const { isGameActive = false, onPositionUpdate } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rectangleSize = { width: 64, height: 64 };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [position, setPosition] = useState<Position>(START_POSITION);
  const [speed] = useState<number>(8);
  const [rotationSpeed] = useState<number>(5);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [currentDisplaySpeed, setCurrentDisplaySpeed] = useState<number>(0);

  const [boundaries, setBoundaries] = useState<Boundaries>({
    minX: 0,
    maxX: 700,
    minY: 0,
    maxY: 500,
  });

  const keyState = useRef<KeyState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleControlPress: (key: keyof KeyState, isPressed: boolean) => {
      keyState.current[key] = isPressed;
    }
  }));

  useEffect(() => {
    const updateBoundaries = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setBoundaries({
          minX: 0,
          maxX: containerRect.width - rectangleSize.width,
          minY: 0,
          maxY: containerRect.height - rectangleSize.height,
        });
      }
    };

    updateBoundaries();
    window.addEventListener("resize", updateBoundaries);
    return () => {
      window.removeEventListener("resize", updateBoundaries);
    };
  }, []);

  // Create a canvas for off-screen color detection
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1440;
      canvas.height = 1024;
      canvasRef.current = canvas;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the track to the off-screen canvas for color detection
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        
        // Försök med olika sökvägar till bilden
        img.src = '/racetrack-map.png'; 
        
        img.onerror = () => {
          console.log("Failed to load main path, trying fallback paths...");
          // Prova olika sökvägar
          const paths = [
            './racetrack-map.png',
            '/public/racetrack-map.png',
            'src/public/racetrack-map.png',
            '/assets/racetrack-map.png',
            '../public/racetrack-map.png'
          ];
          
          let pathIndex = 0;
          const tryNextPath = () => {
            if (pathIndex < paths.length) {
              img.src = paths[pathIndex];
              pathIndex++;
            } else {
              console.error("Could not load track image from any path. Check file location.");
            }
          };
          
          img.onerror = tryNextPath;
          tryNextPath();
        };
      }
    } catch (error) {
      console.error("Error setting up canvas:", error);
    }
  }, []);

  useEffect(() => {
    const checkFocus = () => {
      if (document.activeElement === containerRef.current) {
        setIsFocused(true);
      } else {
        // Also check if any parent element is focused
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
    let animationFrameId: number;

    const updatePosition = () => {
      if (isFocused || isGameActive) {
        setPosition((prev) => {
          let newPos = { ...prev };

          if (keyState.current.ArrowLeft) {
            newPos.rotation = newPos.rotation - rotationSpeed;
          }
          if (keyState.current.ArrowRight) {
            newPos.rotation = newPos.rotation + rotationSpeed;
          }

          const radians = (newPos.rotation * Math.PI) / 180;
          let currentSpeed = speed;

          // Säkrare hantering av canvas
          try {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx && containerRef.current) {
                const container = containerRef.current;
                const scaleX = canvas.width / container.clientWidth;
                const scaleY = canvas.height / container.clientHeight;

                const canvasX = Math.floor((newPos.x + 32) * scaleX);
                const canvasY = Math.floor((newPos.y + 32) * scaleY);

                try {
                  const imageData = ctx.getImageData(canvasX, canvasY, 1, 1).data;
                  const [r, g, b] = imageData;

                  // Grass color check (tolerance around #2A922C)
                  if (
                    r >= 30 &&
                    r <= 60 &&
                    g >= 130 &&
                    g <= 160 &&
                    b >= 30 &&
                    b <= 60
                  ) {
                    currentSpeed = speed * 0.5; // Slow down to 50% on grass
                  }
                } catch (e) {
                  // Om getImageData misslyckas (t.ex. säkerhetsskäl), fortsätt utan färgkoll
                  console.warn("Could not get pixel data:", e);
                }
              }
            }
          } catch (e) {
            console.warn("Canvas error:", e);
          }

          // Update live speed display before calculating movement
          setCurrentDisplaySpeed(currentSpeed);

          let potentialX = newPos.x;
          let potentialY = newPos.y;

          if (keyState.current.ArrowUp) {
            potentialX += Math.sin(radians) * currentSpeed;
            potentialY -= Math.cos(radians) * currentSpeed;
          }
          if (keyState.current.ArrowDown) {
            potentialX -= Math.sin(radians) * currentSpeed;
            potentialY += Math.cos(radians) * currentSpeed;
          }

          newPos.x = Math.max(
            boundaries.minX,
            Math.min(boundaries.maxX, potentialX)
          );
          newPos.y = Math.max(
            boundaries.minY,
            Math.min(boundaries.maxY, potentialY)
          );

          // Call the position update callback if provided
          if (onPositionUpdate) {
            onPositionUpdate({ x: newPos.x, y: newPos.y });
          }

          return newPos;
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
  }, [speed, rotationSpeed, isFocused, boundaries, isGameActive, onPositionUpdate]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white border border-gray-300 rounded-lg overflow-hidden"
      tabIndex={0}
      style={{ outline: "none", height: "500px" }}
    >
      {/* Race track as background */}
      <RaceTrack className="absolute top-0 left-0 w-full h-full pointer-events-none" />

      {/* Go-kart sprite on top */}
      <GoKartSprite
        x={position.x}
        y={position.y}
        rotation={position.rotation}
      />
      <div className="absolute bottom-2 left-2 text-sm text-gray-600">
        {!isFocused &&
          "Klicka på spelplanen för att aktivera tangentbordskontroller"}
      </div>
    </div>
  );
});

// Add display name for better debugging
Gokart.displayName = 'Gokart';

export default Gokart;