import React, { useState, useEffect, useRef } from 'react';

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

const Gokart: React.FC = () => {
  // Use HTMLElement instead of HTMLDivElement for more flexibility
  const containerRef = useRef<HTMLElement>(null);
  const rectangleSize = { width: 64, height: 64 };

  const [position, setPosition] = useState({ x: 350, y: 250, rotation: 0 });
  const [speed] = useState<number>(5);
  const [rotationSpeed] = useState<number>(5); 
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const [boundaries, setBoundaries] = useState<Boundaries>({
    minX: 0,
    maxX: 700,
    minY: 0,
    maxY: 500,
  });

  useEffect(() => {
    const updateBoundaries = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setBoundaries({
          minX: 0,
          maxX: containerRect.width - rectangleSize.width,
          minY: 0,
          maxY: containerRect.height - rectangleSize.height
        });
      }
    };

    updateBoundaries();
   
    window.addEventListener('resize', updateBoundaries);
    
    return () => {
      window.removeEventListener('resize', updateBoundaries);
    };
  }, []);
  
  const keyState = useRef<KeyState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

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
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    
    const updatePosition = () => {
      if (isFocused) {
        setPosition(prev => {
          let newPos = { ...prev };
          
          if (keyState.current.ArrowLeft) {
            newPos.rotation = newPos.rotation - rotationSpeed;
          }
          if (keyState.current.ArrowRight) {
            newPos.rotation = newPos.rotation + rotationSpeed;
          }
          
          const radians = (newPos.rotation * Math.PI) / 180;

          let potentialX = newPos.x;
          let potentialY = newPos.y;
          
          if (keyState.current.ArrowUp) {
            potentialX += Math.sin(radians) * speed;
            potentialY -= Math.cos(radians) * speed;
          }
          if (keyState.current.ArrowDown) {
            potentialX -= Math.sin(radians) * speed;
            potentialY += Math.cos(radians) * speed;
          }
          
          newPos.x = Math.max(boundaries.minX, Math.min(boundaries.maxX, potentialX));
          newPos.y = Math.max(boundaries.minY, Math.min(boundaries.maxY, potentialY));
          
          return newPos;
        });
      }
      
      animationFrameId = requestAnimationFrame(updatePosition);
    };
    
    animationFrameId = requestAnimationFrame(updatePosition);
    
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, rotationSpeed, isFocused, boundaries]); 
  
  return (
    <div 
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative w-full h-full bg-white border border-gray-300 rounded-lg overflow-hidden"
      tabIndex={0}
      style={{ outline: 'none', height: '500px' }}
    >
      <div 
        className="absolute bg-red-600 w-8 h-12 rounded-md shadow-md transition-all duration-100 ease-in-out"
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg)`,
        }}
      >
        <div className="absolute top-0 left-1/2 w-2 h-4 bg-black transform -translate-x-1/2 -translate-y-1/2 rounded-t-full" />
      </div>
      <div className="absolute bottom-2 left-2 text-sm text-gray-600">
        {!isFocused && "Klicka på spelplanen för att aktivera tangentbordskontroller"}
      </div>
    </div>
  );
};

export default Gokart;