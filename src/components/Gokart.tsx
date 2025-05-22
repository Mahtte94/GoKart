import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
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

interface GokartRefHandle {
  handleControlPress: (key: string, isPressed: boolean) => void;
  getTerrainInfo: () => boolean;
}


const START_POSITION: Position = {
  x: 440,
  y: 90,
  rotation: 270,
};

// Use forwardRef to expose methods to parent component
const Gokart = forwardRef<GokartRefHandle, GokartProps>((props, ref) => {
  const { isGameActive = false, onPositionUpdate, onSpeedUpdate } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const rectangleSize = { width: 64, height: 64 };

  // State variables
  const [position, setPosition] = useState<Position>(START_POSITION);
  const [baseSpeed] = useState<number>(4);
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

  const [showTrackDebug, setShowTrackDebug] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        setShowTrackDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const captureTrackImage = useCallback(() => {
    const canvas = backgroundCanvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 896;
    canvas.height = 600;

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      setTimeout(captureTrackImage, 200);
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 896, 600);
        URL.revokeObjectURL(svgUrl);
        console.log('Track image captured successfully for color detection');
      };
      img.onerror = () => {
        console.warn('Failed to load SVG image for color detection');
        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    } catch (error) {
      console.warn('Error capturing track image:', error);
    }
  }, []);

  useEffect(() => {
    if (isGameActive) {
      setTimeout(captureTrackImage, 100);
    }
  }, [isGameActive, captureTrackImage]);

  const isGrassColor = (r: number, g: number, b: number): boolean => {
    
    const isGreenDominant = g > r * 1.3 && g > b * 1.3;
    
    const grassR = 42, grassG = 146, grassB = 44;
    const colorDistance = Math.sqrt(
      Math.pow(r - grassR, 2) + 
      Math.pow(g - grassG, 2) + 
      Math.pow(b - grassB, 2)
    );
    
    return isGreenDominant || colorDistance < 50;
  };

  const sampleColorAtPoint = (x: number, y: number): { r: number, g: number, b: number } | null => {
    const canvas = backgroundCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) return null;
    
    try {
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        return { r: pixel[0], g: pixel[1], b: pixel[2] };
      }
    } catch (error) {
      console.warn("Error sampling color:", error);
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
      { x: kartCenterX - 8, y: kartCenterY - 8, weight: 1 }    
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
    
    const trackPercentage = totalWeight > 0 ? (trackWeight / totalWeight) * 100 : 50;
    
    return trackPercentage >= 60;
  };

  const renderTrackDebug = () => {
    if (!showTrackDebug) return null;
    
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return null;
    
    return (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 opacity-70">
        <canvas 
          width="896"
          height="600"
          style={{ 
            width: '100%', 
            height: '100%',
            imageRendering: 'pixelated'
          }}
          ref={(debugCanvas) => {
            if (debugCanvas && canvas) {
              const debugCtx = debugCanvas.getContext('2d');
              const ctx = canvas.getContext('2d');
              if (debugCtx && ctx) {
                debugCanvas.width = 896;
                debugCanvas.height = 600;
                debugCtx.drawImage(canvas, 0, 0);
                
                const kartCenterX = position.x + 32;
                const kartCenterY = position.y + 32;
                debugCtx.strokeStyle = isOnTrack ? '#00ff00' : '#ff0000';
                debugCtx.lineWidth = 3;
                debugCtx.beginPath();
                debugCtx.arc(kartCenterX, kartCenterY, 20, 0, 2 * Math.PI);
                debugCtx.stroke();
                
                const samplePoints = [
                  { x: kartCenterX, y: kartCenterY },
                  { x: kartCenterX, y: kartCenterY - 12 },
                  { x: kartCenterX + 12, y: kartCenterY },
                  { x: kartCenterX, y: kartCenterY + 12 },
                  { x: kartCenterX - 12, y: kartCenterY }
                ];
                
                samplePoints.forEach(point => {
                  const color = sampleColorAtPoint(point.x, point.y);
                  if (color) {
                    const isGrass = isGrassColor(color.r, color.g, color.b);
                    debugCtx.fillStyle = isGrass ? '#ff0000' : '#00ff00';
                    debugCtx.beginPath();
                    debugCtx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                    debugCtx.fill();
                  }
                });
              }
            }
          }}
        />
        <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-2 text-sm">
          Color-Based Track Detection Debug (Press T to toggle)
          <div>Kart position: x={Math.round(position.x + 32)}, y={Math.round(position.y + 32)}</div>
          <div>Terrain: <span className={isOnTrack ? 'text-green-400' : 'text-red-400'}>{isOnTrack ? 'TRACK' : 'GRASS'}</span></div>
          <div className="text-xs mt-1">Green dots = Track, Red dots = Grass</div>
        </div>
      </div>
    );
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
          
          if (onSpeedUpdate) {
            onSpeedUpdate(newSpeed, maxSpeed);
          }
          
          return newSpeed;
        });
        
        setPosition((prev) => {
          const radians = (rotation * Math.PI) / 180;
          
          const deltaX = Math.sin(radians) * currentSpeed;
          const deltaY = -Math.cos(radians) * currentSpeed;
          
          let newX = prev.x + deltaX + (isOnTrack ? 0 : (Math.random() - 0.5) * shakeFactor);
          let newY = prev.y + deltaY + (isOnTrack ? 0 : (Math.random() - 0.5) * shakeFactor);
          
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
      
      {/* Debug track visualization (toggle with T key) */}
      {renderTrackDebug()}
      
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
      
      {/* Debug help text */}
      {isGameActive && (
        <div className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-50 p-1 rounded text-white">
          Press <kbd className="bg-gray-700 px-1 rounded">T</kbd> to toggle color detection debug
        </div>
      )}
    </div>
  );
});

Gokart.displayName = 'Gokart';

export default Gokart;