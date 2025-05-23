import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface MobileControlsProps {
  onControlPress: (
    key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
    isPressed: boolean
  ) => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onControlPress }) => {
  const handleTouchStart = (
    key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
  ) => {
    onControlPress(key, true);
  };

  const handleTouchEnd = (
    key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
  ) => {
    onControlPress(key, false);
  };

  const ControlButton = ({
    direction,
    icon,
    className = "",
  }: {
    direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
    icon: React.ReactNode;
    className?: string;
  }) => (
    <button
      className={`bg-gray-700 bg-opacity-95 rounded-full flex items-center justify-center active:bg-gray-600 active:scale-95 touch-none select-none shadow-lg border-2 border-gray-600 active:border-gray-500 transition-all duration-75 ${className}`}
      style={{
        width: 'clamp(48px, 12vw, 60px)',
        height: 'clamp(48px, 12vw, 60px)',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTouchStart(direction);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTouchEnd(direction);
      }}
      onTouchCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTouchEnd(direction);
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTouchStart(direction);
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTouchEnd(direction);
      }}
      onMouseLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleTouchEnd(direction);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      {icon}
    </button>
  );

  return (
    <div 
      className="flex justify-between items-center w-full bg-gray-900 bg-opacity-90 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700"
      style={{
        maxWidth: 'min(400px, 90vw)',
        padding: 'clamp(8px, 2vw, 12px)',
        gap: 'clamp(8px, 2vw, 16px)',
      }}
    >
      {/* Steering controls */}
      <div 
        className="flex"
        style={{ gap: 'clamp(6px, 1.5vw, 12px)' }}
      >
        <ControlButton
          direction="ArrowLeft"
          icon={<ArrowLeft className="text-white" style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }} />}
        />
        <ControlButton
          direction="ArrowRight"
          icon={<ArrowRight className="text-white" style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }} />}
        />
      </div>
      
      {/* Acceleration controls */}
      <div 
        className="flex"
        style={{ gap: 'clamp(6px, 1.5vw, 12px)' }}
      >
        <ControlButton
          direction="ArrowDown"
          icon={<ArrowDown className="text-white" style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }} />}
          className="bg-red-700 bg-opacity-95 active:bg-red-600 border-red-600 active:border-red-500"
        />
        <ControlButton
          direction="ArrowUp"
          icon={<ArrowUp className="text-white" style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }} />}
          className="bg-green-700 bg-opacity-95 active:bg-green-600 border-green-600 active:border-green-500"
        />
      </div>
    </div>
  );
};

export default MobileControls;