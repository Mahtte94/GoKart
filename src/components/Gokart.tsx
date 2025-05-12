import React, { useState, useEffect, useRef } from "react";
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

const Gokart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rectangleSize = { width: 64, height: 64 };

  const [position, setPosition] = useState<Position>({
    x: 50,
    y: 50,
    rotation: 0,
  });
  const [speed] = useState<number>(5);
  const [rotationSpeed] = useState<number>(5);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const [boundaries, setBoundaries] = useState<Boundaries>({
    minX: 0,
    maxX: window.innerWidth,
    minY: 0,
    maxY: window.innerHeight,
  });

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

  const keyState = useRef<KeyState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      if (isFocused) {
        setPosition((prev) => {
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

          newPos.x = Math.max(
            boundaries.minX,
            Math.min(boundaries.maxX, potentialX)
          );
          newPos.y = Math.max(
            boundaries.minY,
            Math.min(boundaries.maxY, potentialY)
          );

          return newPos;
        });
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!isFocused) return;

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
  }, [speed, rotationSpeed, isFocused, boundaries]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[800px] bg-gray-100 border border-gray-300 rounded-lg overflow-hidden"
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={() => setIsFocused(true)}
    >
      {/* Race track as background */}
      <RaceTrack className="absolute top-0 left-0 w-full h-full pointer-events-none" />

      {/* Go-kart sprite on top */}
      <GoKartSprite
        x={position.x}
        y={position.y}
        rotation={position.rotation}
      />

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 text-sm text-gray-700 bg-white p-2 rounded shadow">
        {isFocused
          ? "Use arrow keys to move"
          : "Click on the area to enable keyboard controls"}
      </div>
    </div>
  );
};

export default Gokart;
