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

// Track segment structure with proper types for all properties
interface TrackSegment {
  type: 'rect' | 'arc' | 'ellipse';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  centerX?: number;
  centerY?: number;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  startAngle?: number;
  endAngle?: number;
  isOuter: boolean;
}

// Align this with FINISH_LINE in GameController.tsx
const START_POSITION: Position = {
  x: 440, // Match with FINISH_LINE.x in GameController
  y: 50,  // Slightly below the finish line
  rotation: 270, // Pointing downward
};

// Define track segments for detection with proper type definitions
const TRACK_SEGMENTS: TrackSegment[] = [
  // Outer track boundary
  {
    type: 'rect',
    x: 250, 
    y: 0,
    width: 400,
    height: 100,
    isOuter: true
  },
  {
    type: 'rect',
    x: 250,
    y: 450,
    width: 400,
    height: 100,
    isOuter: true
  },
  {
    type: 'arc',
    centerX: 250,
    centerY: 250,
    radius: 150,
    startAngle: Math.PI/2,
    endAngle: 3*Math.PI/2,
    isOuter: true
  },
  {
    type: 'arc',
    centerX: 650,
    centerY: 250,
    radius: 150,
    startAngle: -Math.PI/2,
    endAngle: Math.PI/2,
    isOuter: true
  },
  // Inner track boundary (hole)
  {
    type: 'ellipse',
    centerX: 450,
    centerY: 300,
    radiusX: 150,
    radiusY: 150,
    isOuter: false
  },
  // Middle crossing (vertical path through center)
  {
    type: 'rect',
    x: 425, 
    y: 150,
    width: 50,
    height: 300,
    isOuter: true
  }
];

// Track width constant
const TRACK_WIDTH = 100;

// Use forwardRef to expose methods to parent component
const Gokart = forwardRef<GokartRefHandle, GokartProps>((props, ref) => {
  const { isGameActive = false, onPositionUpdate, onSpeedUpdate } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Track properties - this will be used for the canvas drawing
  const TRACK_COLOR = '#676464'; // Gray track color
  const GRASS_COLOR = '#2A922C'; // Green grass color

  const [boundaries, setBoundaries] = useState<Boundaries>({
    minX: 0,
    maxX: 896 - rectangleSize.width,
    minY: 0,
    maxY: 600 - rectangleSize.height,
  });

  // Debug mode to visualize the track detection
  const [showTrackDebug, setShowTrackDebug] = useState<boolean>(false);

  // Toggle debug mode
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
  
  // Render debug view of the track map
  const renderTrackDebug = () => {
    if (!showTrackDebug) return null;
    
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    return (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 opacity-50">
        <img 
          src={canvas.toDataURL('image/png')} 
          alt="Track Detection Map" 
          className="w-full h-full"
        />
        <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-2 text-sm">
          Track Detection Debug Mode (Press T to toggle)
          <div>Kart position: x={Math.round(position.x + 32)}, y={Math.round(position.y + 32)}</div>
          <div>Terrain: {isOnTrack ? 'TRACK' : 'GRASS'}</div>
        </div>
      </div>
    );
  };

  // Use useEffect to draw the track onto the canvas for terrain detection
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (canvas && ctx) {
      console.log("Drawing track map to hidden canvas for terrain detection");
      
      // Set canvas dimensions to match the track
      canvas.width = 896;
      canvas.height = 600;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fill the canvas with grass color first
      ctx.fillStyle = GRASS_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the track based on your screenshots
      ctx.fillStyle = TRACK_COLOR;
      
      // Strategy: Draw the track outline first
      ctx.beginPath();
      
      // Outer track boundary - starting from top center and going clockwise
      ctx.moveTo(450, 0);       // Top center
      ctx.lineTo(650, 0);       // Top right
      ctx.lineTo(750, 50);      // Right curve start
      ctx.quadraticCurveTo(830, 150, 830, 250);  // Right top curve
      ctx.lineTo(830, 350);     // Right straight
      ctx.quadraticCurveTo(830, 450, 750, 500);  // Right bottom curve
      ctx.lineTo(650, 550);     // Bottom right
      ctx.lineTo(250, 550);     // Bottom straight
      ctx.lineTo(150, 500);     // Bottom left curve start
      ctx.quadraticCurveTo(70, 450, 70, 350);    // Left bottom curve
      ctx.lineTo(70, 250);      // Left straight
      ctx.quadraticCurveTo(70, 150, 150, 50);    // Left top curve
      ctx.lineTo(250, 0);       // Top left
      ctx.closePath();
      ctx.fill();
      
      // Now cut out the inner track to create the racing shape
      ctx.globalCompositeOperation = 'destination-out';
      
      // Inner track boundary (the "hole" in the track)
      ctx.beginPath();
      
      // Central oval - starting from top and going clockwise
      ctx.moveTo(450, 150);     // Top center
      ctx.lineTo(550, 150);     // Top right
      ctx.quadraticCurveTo(650, 200, 650, 300);  // Right curve
      ctx.quadraticCurveTo(650, 400, 550, 450);  // Bottom right curve
      ctx.lineTo(350, 450);     // Bottom straight
      ctx.quadraticCurveTo(250, 400, 250, 300);  // Bottom left curve
      ctx.quadraticCurveTo(250, 200, 350, 150);  // Left top curve
      ctx.closePath();
      ctx.fill();
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
      
      // Add middle crossing path - this appears to be visible track in your game
      // From screenshot 3, it shows you can drive through the middle section
      ctx.fillStyle = TRACK_COLOR;
      ctx.beginPath();
      ctx.rect(425, 150, 50, 300); // Vertical path connecting top and bottom
      ctx.fill();
      
      // Add a thin black border around the track to help with edge detection
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 2;
      
      // Outer track boundary
      ctx.beginPath();
      ctx.moveTo(450, 0);
      ctx.lineTo(650, 0);
      ctx.lineTo(750, 50);
      ctx.quadraticCurveTo(830, 150, 830, 250);
      ctx.lineTo(830, 350);
      ctx.quadraticCurveTo(830, 450, 750, 500);
      ctx.lineTo(650, 550);
      ctx.lineTo(250, 550);
      ctx.lineTo(150, 500);
      ctx.quadraticCurveTo(70, 450, 70, 350);
      ctx.lineTo(70, 250);
      ctx.quadraticCurveTo(70, 150, 150, 50);
      ctx.lineTo(250, 0);
      ctx.closePath();
      ctx.stroke();
      
      // Inner track boundary
      ctx.beginPath();
      ctx.moveTo(450, 150);
      ctx.lineTo(550, 150);
      ctx.quadraticCurveTo(650, 200, 650, 300);
      ctx.quadraticCurveTo(650, 400, 550, 450);
      ctx.lineTo(350, 450);
      ctx.quadraticCurveTo(250, 400, 250, 300);
      ctx.quadraticCurveTo(250, 200, 350, 150);
      ctx.closePath();
      ctx.stroke();
      
      // Middle vertical path
      ctx.beginPath();
      ctx.rect(425, 150, 50, 300);
      ctx.stroke();
      
      console.log("Exact race track map drawn to canvas for terrain detection");
    }
  }, []);

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
          
          // Check if new position is on track using the canvas pixel data
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

  // Helper function to sample a point on the track canvas and determine if it's on the track
  const sampleTrackPoint = (x: number, y: number): boolean => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) return true; // Default to track if we can't check
    
    try {
      // Make sure coordinates are within canvas bounds
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        // Get the pixel color at the specified point
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const [r, g, b] = pixel;
        
        // Based on screenshots, the track is gray (#666666) and grass is green (#2A922C)
        // Simple but accurate color check for green (grass)
        if (g > r * 1.5 && g > b * 1.5) {
          return false; // On grass - green is much higher than red and blue
        }
        
        // Simple check for gray (track)
        // In gray, R, G, and B values are all similar
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        if (maxDiff < 50) {
          return true; // On track - colors are similar
        }
        
        // More precise color distance calculation as fallback
        const trackR = 102; // #666666
        const trackG = 102;
        const trackB = 102;
        
        const grassR = 42;  // #2A922C
        const grassG = 146;
        const grassB = 44;
        
        const trackDistance = Math.sqrt(
          Math.pow(r - trackR, 2) + 
          Math.pow(g - trackG, 2) + 
          Math.pow(b - trackB, 2)
        );
        
        const grassDistance = Math.sqrt(
          Math.pow(r - grassR, 2) + 
          Math.pow(g - grassG, 2) + 
          Math.pow(b - grassB, 2)
        );
        
        return trackDistance < grassDistance;
      }
    } catch (error) {
      console.warn("Error sampling track point:", error);
    }
    
    return fallbackTrackDetection(x, y); // Use fallback if sampling fails
  };

  // Improved function to check if a position is on the track using multiple sample points
  const isPositionOnTrack = (x: number, y: number): boolean => {
    // Get the center point of the kart
    const kartCenterX = Math.floor(x + rectangleSize.width / 2);
    const kartCenterY = Math.floor(y + rectangleSize.height / 2);
    
    // Create a more detailed grid of 13 sample points for precise detection
    // This grid forms a diamond pattern with more points at the edges
    const samplePoints = [
      // Center point (most important)
      { x: kartCenterX, y: kartCenterY, weight: 3 },
      
      // Inner diamond (4 points)
      { x: kartCenterX, y: kartCenterY - 12, weight: 2 },  // North
      { x: kartCenterX + 12, y: kartCenterY, weight: 2 },  // East
      { x: kartCenterX, y: kartCenterY + 12, weight: 2 },  // South
      { x: kartCenterX - 12, y: kartCenterY, weight: 2 },  // West
      
      // Outer diamond (8 points)
      { x: kartCenterX, y: kartCenterY - 25, weight: 1 },  // Far North
      { x: kartCenterX + 18, y: kartCenterY - 18, weight: 1 }, // Northeast
      { x: kartCenterX + 25, y: kartCenterY, weight: 1 },  // Far East
      { x: kartCenterX + 18, y: kartCenterY + 18, weight: 1 }, // Southeast
      { x: kartCenterX, y: kartCenterY + 25, weight: 1 },  // Far South
      { x: kartCenterX - 18, y: kartCenterY + 18, weight: 1 }, // Southwest
      { x: kartCenterX - 25, y: kartCenterY, weight: 1 },  // Far West
      { x: kartCenterX - 18, y: kartCenterY - 18, weight: 1 }  // Northwest
    ];
    
    // Use a weighted voting system
    let totalWeight = 0;
    let trackWeight = 0;
    
    for (const point of samplePoints) {
      const isOnTrack = sampleTrackPoint(point.x, point.y);
      totalWeight += point.weight;
      if (isOnTrack) {
        trackWeight += point.weight;
      }
    }
    
    // Calculate percentage (0-100) of points on track
    const trackPercentage = (trackWeight / totalWeight) * 100;
    
    // Consider the kart on track if more than 60% of the weighted points are on track
    // This threshold can be adjusted as needed
    return trackPercentage >= 60;
  };

  // Fixed fallback track detection using track segments rather than the undefined curves
  const fallbackTrackDetection = (x: number, y: number): boolean => {
    // Get the center of the kart
    const kartCenterX = x + rectangleSize.width / 2;
    const kartCenterY = y + rectangleSize.height / 2;
    
    // Check against predefined track segments
    let insideOuter = false;
    let insideInner = false;
    
    for (const segment of TRACK_SEGMENTS) {
      if (segment.type === 'rect') {
        // Check if point is inside a rectangular segment
        if (segment.x !== undefined && segment.y !== undefined && 
            segment.width !== undefined && segment.height !== undefined) {
          const isInside = (
            kartCenterX >= segment.x && 
            kartCenterX <= segment.x + segment.width && 
            kartCenterY >= segment.y && 
            kartCenterY <= segment.y + segment.height
          );
          
          if (isInside) {
            if (segment.isOuter) {
              insideOuter = true;
            } else {
              insideInner = true;
            }
          }
        }
      } 
      else if (segment.type === 'arc') {
        // Check if point is inside an arc segment
        if (segment.centerX !== undefined && segment.centerY !== undefined && 
            segment.radius !== undefined && segment.startAngle !== undefined && 
            segment.endAngle !== undefined) {
          const dx = kartCenterX - segment.centerX;
          const dy = kartCenterY - segment.centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Check if distance is within track width of the arc radius
          const isWithinTrackWidth = (
            distance <= segment.radius && 
            distance >= segment.radius - TRACK_WIDTH
          );
          
          // Check if angle is within arc bounds
          const angle = Math.atan2(dy, dx);
          const normalizedAngle = (angle < 0) ? angle + 2 * Math.PI : angle;
          let isWithinAngles = false;
          
          if (segment.startAngle <= segment.endAngle) {
            isWithinAngles = normalizedAngle >= segment.startAngle && normalizedAngle <= segment.endAngle;
          } else {
            isWithinAngles = normalizedAngle >= segment.startAngle || normalizedAngle <= segment.endAngle;
          }
          
          if (isWithinTrackWidth && isWithinAngles) {
            if (segment.isOuter) {
              insideOuter = true;
            } else {
              insideInner = true;
            }
          }
        }
      }
      else if (segment.type === 'ellipse') {
        // Check if point is inside an elliptical segment
        if (segment.centerX !== undefined && segment.centerY !== undefined && 
            segment.radiusX !== undefined && segment.radiusY !== undefined) {
          const normalizedX = (kartCenterX - segment.centerX) / segment.radiusX;
          const normalizedY = (kartCenterY - segment.centerY) / segment.radiusY;
          const distance = normalizedX * normalizedX + normalizedY * normalizedY;
          
          if (distance <= 1) {
            if (segment.isOuter) {
              insideOuter = true;
            } else {
              insideInner = true;
            }
          }
        }
      }
    }
    
    // On track if inside outer boundary but not inside inner boundary
    return insideOuter && !insideInner;
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
      style={{ outline: "none", width: "896px", height: "600px" }} 
      onClick={handleContainerClick}
    >
      {/* Hidden canvas for pixel detection */}
      <canvas
        ref={canvasRef}
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
          Press <kbd className="bg-gray-700 px-1 rounded">T</kbd> to toggle track detection debug
        </div>
      )}
    </div>
  );
});

// Add display name for better debugging
Gokart.displayName = 'Gokart';

export default Gokart;