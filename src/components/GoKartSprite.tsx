import React from "react";

interface GoKartSpriteProps {
  x: number;
  y: number;
  rotation: number;
}

function GoKartSprite(props: GoKartSpriteProps) {
  const { x, y, rotation } = props;

  return (
    <div
      className="absolute"
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
        transformOrigin: "center",
        width: "64px",
        height: "64px",
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width="64"
        height="64"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "rotate(180deg)" }}
      >
        {/* Body */}
        <rect x="20" y="20" width="24" height="44" rx="6" fill="#FF4136" />
        {/* Wheels */}
        <rect x="14" y="18" width="8" height="14" fill="#111" />
        <rect x="42" y="18" width="8" height="14" fill="#111" />
        <rect x="14" y="42" width="8" height="14" fill="#111" />
        <rect x="42" y="42" width="8" height="14" fill="#111" />
      </svg>
    </div>
  );
}

export default GoKartSprite;
