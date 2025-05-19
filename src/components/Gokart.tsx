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
  onSpeedUpdate?: (speed: number, maxSpeed: number) => void;
}

// Define the ref type interface
interface GokartRefHandle {
  handleControlPress: (key: string, isPressed: boolean) => void;
  getTerrainInfo: () => boolean;
}

// Align this with FINISH_LINE in GameController.tsx
const START_POSITION: Position = {
  x: 440, // Match with FINISH_LINE.x in GameController
  y: 50,  // Slightly below the finish line
  rotation: 270, // Pointing downward
};

// Use forwardRef to expose methods to parent component
const Gokart = forwardRef<GokartRefHandle, GokartProps>((props, ref) => {
  const { isGameActive = false, onPositionUpdate, onSpeedUpdate } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const rectangleSize = { width: 64, height: 64 };

  // State variables
  const [position, setPosition] = useState<Position>(START_POSITION);
  const [baseSpeed] = useState<number>(8); // Base speed when on track
  const [isOnTrack, setIsOnTrack] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(START_POSITION.rotation);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(baseSpeed);
  const [acceleration] = useState<number>(0.3); // How quickly the kart speeds up
  const [deceleration] = useState<number>(0.15); // How quickly the kart slows down
  const [rotationSpeed] = useState<number>(5); // Base rotation speed
  const [isFocused, setIsFocused] = useState<boolean>(false);
  
  // Visual effects for terrain
  const [shakeFactor, setShakeFactor] = useState<number>(0);
  
  // Constants for physics
  const GRASS_SPEED_FACTOR = 0.4; // 40% speed on grass (more noticeable)
  const GRASS_ROTATION_FACTOR = 0.7; // 70% rotation speed on grass
  const GRASS_DRAG = 1.2; // Higher drag on grass
  const MAX_SHAKE = 2; // Maximum shake pixels when on grass

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

  // Set shake effect when off-track
  useEffect(() => {
    if (!isOnTrack && currentSpeed > 2) {
      // Add random shake when on grass and moving
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
          
          // Apply rotation based on terrain
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
          
          // Determine speed factors based on terrain
          const terrainSpeedFactor = isOnTrack ? 1 : GRASS_SPEED_FACTOR;
          const terrainDragFactor = isOnTrack ? 1 : GRASS_DRAG;
          
          // Set max speed based on terrain
          setMaxSpeed(baseSpeed * terrainSpeedFactor);
          
          // Apply acceleration/deceleration
          if (keyState.current.ArrowUp) {
            newSpeed += acceleration * terrainSpeedFactor;
          } else if (keyState.current.ArrowDown) {
            newSpeed -= acceleration * terrainSpeedFactor;
          } else {
            // Natural deceleration when no keys are pressed
            if (newSpeed > 0) {
              newSpeed -= deceleration * terrainDragFactor;
            } else if (newSpeed < 0) {
              newSpeed += deceleration * terrainDragFactor;
            }
            
            // Clamp to zero if very small
            if (Math.abs(newSpeed) < 0.1) {
              newSpeed = 0;
            }
          }
          
          // Clamp to max speed in either direction
          newSpeed = Math.min(maxSpeed, Math.max(-maxSpeed * 0.6, newSpeed));
          
          // Report speed to parent component
          if (onSpeedUpdate) {
            onSpeedUpdate(newSpeed, maxSpeed);
          }
          
          return newSpeed;
        });
        
        setPosition((prev) => {
          // Convert rotation to radians
          const radians = (rotation * Math.PI) / 180;
          
          // Calculate position change based on speed and rotation
          const deltaX = Math.sin(radians) * currentSpeed;
          const deltaY = -Math.cos(radians) * currentSpeed;
          
          // Apply movement
          let newX = prev.x + deltaX + (isOnTrack ? 0 : (Math.random() - 0.5) * shakeFactor);
          let newY = prev.y + deltaY + (isOnTrack ? 0 : (Math.random() - 0.5) * shakeFactor);
          
          // Check boundaries
          newX = Math.max(boundaries.minX, Math.min(boundaries.maxX, newX));
          newY = Math.max(boundaries.minY, Math.min(boundaries.maxY, newY));
          
          // Check if new position is on track and update
          const onTrack = isPositionOnTrack(newX, newY);
          setIsOnTrack(onTrack);
          
          // Provide position update to parent component
          if (onPositionUpdate) {
            onPositionUpdate({ x: newX, y: newY });
          }
          
          return {
            x: newX,
            y: newY,
            rotation: rotation
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
  }, [rotation, currentSpeed, maxSpeed, isFocused, boundaries, isGameActive, onPositionUpdate, isOnTrack, shakeFactor, onSpeedUpdate]);

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

  // Visual effect elements
  const renderTerrainEffects = () => {
    if (!isOnTrack && currentSpeed > 1) {
      return (
        <div className="absolute inset-0 pointer-events-none">
          {/* Small dust particles when on grass */}
          <div className="absolute" 
            style={{
              left: `${position.x + 32}px`,
              top: `${position.y + 32}px`,
              zIndex: 10
            }}>
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
                  animationDelay: `${Math.random() * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-white border border-gray-300 rounded-lg overflow-hidden"
      tabIndex={0}
      style={{ outline: "none", width: "896px", height: "600px" }} 
      onClick={handleContainerClick}
    >
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
      
      {/* Speed indicator (optional for debugging) */}
      {isGameActive && (
        <div 
          className={`absolute bottom-10 left-2 text-xs px-2 py-1 rounded ${
            isOnTrack ? 'bg-blue-800' : 'bg-yellow-800'} text-white opacity-60`}
        >
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isOnTrack ? 'bg-blue-500' : 'bg-yellow-500'}`} 
                style={{ width: `${(Math.abs(currentSpeed) / baseSpeed) * 100}%` }}
              />
            </div>
            <span>{Math.round(Math.abs(currentSpeed) * 10) / 10}</span>
          </div>
        </div>
      )}
      
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