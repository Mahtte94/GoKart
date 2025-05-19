// src/components/Gokart.tsx
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
  handleControlPress: (key: string, isPressed: boolean) => void;
}

// Align this with FINISH_LINE in GameController.tsx
const START_POSITION: Position = {
  x: 440, // Match with FINISH_LINE.x in GameController
  y: 50,  // Slightly below the finish line
  rotation: 270, // Pointing downward
};

// Use forwardRef to expose methods to parent component
const Gokart = forwardRef<GokartRefHandle, GokartProps>((props, ref) => {
  const { isGameActive = false, onPositionUpdate } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rectangleSize = { width: 64, height: 64 };

  const [position, setPosition] = useState<Position>(START_POSITION);
  const [speed] = useState<number>(8);
  const [isOnTrack, setIsOnTrack] = useState<boolean>(true);
  const [rotationSpeed] = useState<number>(5);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const [boundaries, setBoundaries] = useState<Boundaries>({
    minX: 0,
    maxX: 896 - rectangleSize.width,
    minY: 0,
    maxY: 600 - rectangleSize.height,
  });

  // Reset position when game state changes
  useEffect(() => {
    if (isGameActive) {
      setPosition(START_POSITION);
    }
  }, [isGameActive]);

  const keyState = useRef<KeyState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleControlPress: (key: string, isPressed: boolean) => {
      if (key in keyState.current) {
        keyState.current[key as keyof KeyState] = isPressed;
      }
    },
    getTerrainInfo: () => isOnTrack
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
      if ((isFocused || isGameActive) && isGameActive) {
        setPosition((prev) => {
          let newPos = { ...prev };

          if (keyState.current.ArrowLeft) {
            newPos.rotation = newPos.rotation - rotationSpeed;
          }
          if (keyState.current.ArrowRight) {
            newPos.rotation = newPos.rotation + rotationSpeed;
          }

          const radians = (newPos.rotation * Math.PI) / 180;
          let speedFactor = speed;

          // Simplified terrain detection - we'll use position instead of color detection
          // This avoids issues with loading external images
          
          // Rough track boundaries - these are approximate values based on the track SVG
          const onTrack = isPositionOnTrack(newPos.x, newPos.y);
          setIsOnTrack(onTrack); // Update the terrain state
          
          if (!onTrack) {
            speedFactor = speed * 0.5; // Slow down to 50% on grass
          }

          let potentialX = newPos.x;
          let potentialY = newPos.y;

          if (keyState.current.ArrowUp) {
            potentialX += Math.sin(radians) * speedFactor;
            potentialY -= Math.cos(radians) * speedFactor;
          }
          if (keyState.current.ArrowDown) {
            potentialX -= Math.sin(radians) * speedFactor;
            potentialY += Math.cos(radians) * speedFactor;
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

  // Helper function to determine if the kart is on the track based on position
  const isPositionOnTrack = (x: number, y: number): boolean => {
    // Track shape is complex, so we'll use multiple segments to define the track
    // These are approximations based on visual observation of your screenshots
    
    // Main track segments - this divides the track into sections
    const segments = [
      // Top straight section (finish line area)
      (posX: number, posY: number) => {
        return posX >= 350 && posX <= 650 && posY >= 0 && posY <= 120;
      },
      // Right curve
      (posX: number, posY: number) => {
        // Right top curve
        const centerX = 700;
        const centerY = 200;
        const radiusX = 130;
        const radiusY = 100;
        const normalizedX = (posX - centerX) / radiusX;
        const normalizedY = (posY - centerY) / radiusY;
        return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
      },
      // Right bottom curve (near CP2)
      (posX: number, posY: number) => {
        const centerX = 680;
        const centerY = 400;
        const radiusX = 120;
        const radiusY = 120;
        const normalizedX = (posX - centerX) / radiusX;
        const normalizedY = (posY - centerY) / radiusY;
        return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
      },
      // Bottom section connecting right and left curves
      (posX: number, posY: number) => {
        return posX >= 300 && posX <= 650 && posY >= 380 && posY <= 480;
      },
      // Left bottom curve (near CP1)
      (posX: number, posY: number) => {
        const centerX = 220;
        const centerY = 380;
        const radiusX = 120;
        const radiusY = 120;
        const normalizedX = (posX - centerX) / radiusX;
        const normalizedY = (posY - centerY) / radiusY;
        return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
      },
      // Left upper curve
      (posX: number, posY: number) => {
        const centerX = 200;
        const centerY = 200;
        const radiusX = 120;
        const radiusY = 100;
        const normalizedX = (posX - centerX) / radiusX;
        const normalizedY = (posY - centerY) / radiusY;
        return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
      },
      // Center-left section connecting curves
      (posX: number, posY: number) => {
        return posX >= 150 && posX <= 370 && posY >= 200 && posY <= 380;
      },
      // Center-right section connecting curves
      (posX: number, posY: number) => {
        return posX >= 520 && posX <= 750 && posY >= 200 && posY <= 380;
      }
    ];
    
    // Check if position is in any of the track segments
    for (const segment of segments) {
      if (segment(x, y)) {
        return true;
      }
    }
    
    return false;
  };

  // Function to handle clicking on the container (for focus)
  const handleContainerClick = () => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-white border border-gray-300 rounded-lg overflow-hidden"
      tabIndex={0}
      style={{ outline: "none", width: "896px", height: "600px" }} // Exact dimensions from the original screenshot
      onClick={handleContainerClick}
    >
      {/* Race track as background */}
      <RaceTrack className="absolute top-0 left-0 w-full h-full pointer-events-none" />

      {/* Go-kart sprite on top */}
      <GoKartSprite
        x={position.x}
        y={position.y}
        rotation={position.rotation}
      />
      
      {/* Focus notification */}
      <div className="absolute bottom-2 left-2 text-sm bg-black bg-opacity-50 p-1 rounded text-white">
        {!isFocused && isGameActive &&
          "Klicka på spelplanen för att aktivera tangentbordskontroller"}
      </div>
    </div>
  );
});

// Add display name for better debugging
Gokart.displayName = 'Gokart';

export default Gokart;