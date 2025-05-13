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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [position, setPosition] = useState({
    x: 350,
    y: 250,
    rotation: 0,
  });
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const img = new Image();
      img.src = "/racetrack-map.png";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log("Track image loaded to canvas");
      };
    }
  }, []);

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

          // Read pixel color under car center
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          let currentSpeed = speed;

          if (ctx) {
            const container = containerRef.current;
            if (container) {
              if (!canvas) return prev;
              const scaleX = canvas.width / container.clientWidth;
              const scaleY = canvas.height / container.clientHeight;

              const canvasX = Math.floor((newPos.x + 32) * scaleX);
              const canvasY = Math.floor((newPos.y + 32) * scaleY);

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
            }
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
  }, [speed, rotationSpeed, isFocused, boundaries, boundaries]);

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative w-full h-[600px] bg-white border border-gray-300 rounded-lg overflow-hidden outline-none"
      tabIndex={0}
    >
      {/* Hidden canvas for pixel detection */}
      <canvas
        ref={canvasRef}
        width={1440}
        height={1024}
        style={{ display: "none" }}
      />

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
      <div className="absolute bottom-2 left-2 text-lg text-white">
        Speed: {currentDisplaySpeed.toFixed(1)}
      </div>
    </div>
  );
};

export default Gokart;
