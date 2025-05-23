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
  }: {
    direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
    icon: React.ReactNode;
  }) => (
    <button
      className="bg-gray-700 bg-opacity-90 rounded-full p-3 w-16 h-16 flex items-center justify-center active:bg-gray-600 touch-none select-none shadow-lg"
      onTouchStart={() => handleTouchStart(direction)}
      onTouchEnd={() => handleTouchEnd(direction)}
      onMouseDown={() => handleTouchStart(direction)}
      onMouseUp={() => handleTouchEnd(direction)}
      onMouseLeave={() => handleTouchEnd(direction)}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex justify-center items-center gap-6 sm:gap-8 w-full px-4 py-3 bg-gray-900 bg-opacity-70 rounded-lg">
      <div className="flex gap-3">
        <ControlButton
          direction="ArrowLeft"
          icon={<ArrowLeft className="text-white w-7 h-7" />}
        />
        <ControlButton
          direction="ArrowRight"
          icon={<ArrowRight className="text-white w-7 h-7" />}
        />
      </div>
      
      <div className="flex gap-3">
        <ControlButton
          direction="ArrowDown"
          icon={<ArrowDown className="text-white w-7 h-7" />}
        />
        <ControlButton
          direction="ArrowUp"
          icon={<ArrowUp className="text-white w-7 h-7" />}
        />
      </div>
    </div>
  );
};

export default MobileControls;