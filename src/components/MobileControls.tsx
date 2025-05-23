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
      className={`bg-gray-700 bg-opacity-90 rounded-full p-2.5 sm:p-3 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center active:bg-gray-600 touch-none select-none shadow-lg border-2 border-gray-600 active:border-gray-500 ${className}`}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTouchStart(direction);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleTouchEnd(direction);
      }}
      onTouchCancel={(e) => {
        e.preventDefault();
        handleTouchEnd(direction);
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        handleTouchStart(direction);
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        handleTouchEnd(direction);
      }}
      onMouseLeave={(e) => {
        e.preventDefault();
        handleTouchEnd(direction);
      }}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex justify-between items-center w-full max-w-sm mx-auto px-2 py-2 bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl">
      {/* Steering controls */}
      <div className="flex gap-2 sm:gap-3">
        <ControlButton
          direction="ArrowLeft"
          icon={<ArrowLeft className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
        />
        <ControlButton
          direction="ArrowRight"
          icon={<ArrowRight className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
        />
      </div>
      
      {/* Acceleration controls */}
      <div className="flex gap-2 sm:gap-3">
        <ControlButton
          direction="ArrowDown"
          icon={<ArrowDown className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
          className="bg-red-700 bg-opacity-90 active:bg-red-600"
        />
        <ControlButton
          direction="ArrowUp"
          icon={<ArrowUp className="text-white w-5 h-5 sm:w-6 sm:h-6" />}
          className="bg-green-700 bg-opacity-90 active:bg-green-600"
        />
      </div>
    </div>
  );
};

export default MobileControls;