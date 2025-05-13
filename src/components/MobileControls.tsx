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
    label,
  }: {
    direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
    icon: React.ReactNode;
    label: string;
  }) => (
    <div className="flex flex-col items-center">
      <div
        className="bg-gray-700 rounded-lg p-2 w-14 h-14 flex items-center justify-center mb-2 active:bg-gray-600 cursor-pointer touch-manipulation"
        onTouchStart={() => handleTouchStart(direction)}
        onTouchEnd={() => handleTouchEnd(direction)}
        onMouseDown={() => handleTouchStart(direction)}
        onMouseUp={() => handleTouchEnd(direction)}
        onMouseLeave={() => handleTouchEnd(direction)}
      >
        {icon}
      </div>
      <span className="text-white">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center mb-6  p-6 rounded-lg">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div></div>
        <ControlButton
          direction="ArrowUp"
          icon={<ArrowUp className="text-white w-8 h-8" />}
          label="Framåt"
        />
        <div></div>
        <ControlButton 
          direction="ArrowLeft" 
          icon={<ArrowLeft className="text-white w-8 h-8" />}
          label="Vänster"
        />
        
        <ControlButton 
          direction="ArrowDown" 
          icon={<ArrowDown className="text-white w-8 h-8" />}
          label="Bakåt"
        />
        
        <ControlButton 
          direction="ArrowRight" 
          icon={<ArrowRight className="text-white w-8 h-8" />}
          label="Höger"
        />
      </div>
    </div>
  );
};

export default MobileControls;
