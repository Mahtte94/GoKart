import { useState, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Boundary {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface CarLogicProps {
  initialPosition: Position;
  initialRotation: number;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  isPlayer: boolean;
  boundaries?: Boundary;
 
  onPositionUpdate?: (position: Position, rotation: number, velocity: number) => void;
}

/**
 * Custom hook that handles car physics and controls
 */
const useCarLogic = ({
  initialPosition,
  initialRotation,
  maxSpeed,
  acceleration,
  handling,
  isPlayer,
  boundaries,
  onPositionUpdate,
}: CarLogicProps) => {
  // Car state
  const [position, setPosition] = useState<Position>(initialPosition);
  const [rotation, setRotation] = useState<number>(initialRotation);
  const [velocity, setVelocity] = useState<number>(0);
  const [isAccelerating, setIsAccelerating] = useState<boolean>(false);
  const [isTurningLeft, setIsTurningLeft] = useState<boolean>(false);
  const [isTurningRight, setIsTurningRight] = useState<boolean>(false);
  
  // Physics constants
  const FRICTION = 0.98;
  const ACCELERATION_FACTOR = acceleration * 0.01;
  const ROTATION_SPEED = handling * 0.5;
  const COLLISION_BOUNCE = 0.5;
  
  // Car dimensions (for collision detection)
  const CAR_WIDTH = 40;
  const CAR_HEIGHT = 70;
  
  // Check collision with boundaries
  const checkBoundaryCollision = useCallback((pos: Position): boolean => {
    if (!boundaries) return false;
    
    const halfWidth = CAR_WIDTH / 2;
    const halfHeight = CAR_HEIGHT / 2;
    
    return (
      pos.x - halfWidth < boundaries.minX ||
      pos.x + halfWidth > boundaries.maxX ||
      pos.y - halfHeight < boundaries.minY ||
      pos.y + halfHeight > boundaries.maxY
    );
  }, [boundaries]);
  
  // Input handling for player cars
  useEffect(() => {
    if (!isPlayer) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setIsAccelerating(true);
          break;
        case 'ArrowLeft':
          setIsTurningLeft(true);
          break;
        case 'ArrowRight':
          setIsTurningRight(true);
          break;
        case 'ArrowDown':
          // Add brake logic here if needed
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setIsAccelerating(false);
          break;
        case 'ArrowLeft':
          setIsTurningLeft(false);
          break;
        case 'ArrowRight':
          setIsTurningRight(false);
          break;
        case 'ArrowDown':
          // Add brake release logic here if needed
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlayer]);
  
  // Physics update loop
  useEffect(() => {
    const updatePhysics = () => {
      // Update velocity based on acceleration and friction
      let newVelocity = velocity;
      
      if (isAccelerating) {
        newVelocity += ACCELERATION_FACTOR;
        if (newVelocity > maxSpeed) {
          newVelocity = maxSpeed;
        }
      } else {
        newVelocity *= FRICTION;
        
        // Stop completely if velocity is very small
        if (Math.abs(newVelocity) < 0.01) {
          newVelocity = 0;
        }
      }
      
      // Update rotation based on turning inputs (only when moving)
      let newRotation = rotation;
      if (Math.abs(newVelocity) > 0.1) {
        const turnFactor = ROTATION_SPEED * (Math.abs(newVelocity) / maxSpeed);
        
        if (isTurningLeft) {
          newRotation -= turnFactor;
        }
        
        if (isTurningRight) {
          newRotation += turnFactor;
        }
        
        // Normalize rotation to 0-360 degrees
        newRotation = newRotation % 360;
        if (newRotation < 0) {
          newRotation += 360;
        }
      }
      
      // Calculate new position based on velocity and rotation
      const radians = (newRotation * Math.PI) / 180;
      let newPosition = {
        x: position.x + Math.sin(radians) * newVelocity,
        y: position.y - Math.cos(radians) * newVelocity,
      };
      
      // Check for boundary collisions
      if (checkBoundaryCollision(newPosition)) {
        // Bounce off the boundary by reducing velocity and reversing direction slightly
        newVelocity *= -COLLISION_BOUNCE;
        
        // Use the previous position to avoid getting stuck in the boundary
        newPosition = position;
      }
      
      // Update state
      setVelocity(newVelocity);
      setRotation(newRotation);
      setPosition(newPosition);
      
      // Notify parent component if needed - for future game context integration
      if (onPositionUpdate) {
        onPositionUpdate(newPosition, newRotation, newVelocity);
      }
    };
    
    const intervalId = setInterval(updatePhysics, 16); // ~60fps
    
    return () => clearInterval(intervalId);
  }, [
    velocity, position, rotation, 
    isAccelerating, isTurningLeft, isTurningRight,
    maxSpeed, ACCELERATION_FACTOR, ROTATION_SPEED,
    COLLISION_BOUNCE, checkBoundaryCollision, onPositionUpdate
  ]);
  
  // Function to manually control the car (useful for AI cars)
  const controlCar = useCallback((accelerate: boolean, turnLeft: boolean, turnRight: boolean) => {
    setIsAccelerating(accelerate);
    setIsTurningLeft(turnLeft);
    setIsTurningRight(turnRight);
  }, []);
  
  // Reset car to initial state
  const resetCar = useCallback(() => {
    setPosition(initialPosition);
    setRotation(initialRotation);
    setVelocity(0);
    setIsAccelerating(false);
    setIsTurningLeft(false);
    setIsTurningRight(false);
  }, [initialPosition, initialRotation]);
  
  return {
    // Car state
    position,
    rotation,
    velocity,
    isAccelerating,
    isTurningLeft,
    isTurningRight,
    
    // Control functions
    handleAccelerate: setIsAccelerating,
    handleTurnLeft: setIsTurningLeft,
    handleTurnRight: setIsTurningRight,
    controlCar,
    resetCar,
  };
};

export default useCarLogic;