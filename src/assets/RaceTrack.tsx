import React from "react";

interface MySvgProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  width?: number | string;
  height?: number | string;
}

function RaceTrack({
  className,
  width = "100%",
  height = "100%",
  ...props
}: MySvgProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 1440 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      {...props}
    >
      <g clipPath="url(#clip0_1_3)">
        <rect width="1440" height="1024" fill="white" />
        <rect width="1440" height="1024" fill="#2A922C" id="grass" />
        <g filter="url(#filter0_d_1_3)">
          <path
            d="M790.323 228.422H611.145C578.234 228.422 225.565 149.638 213.783 189.03C202 228.422 241.005 263.3 254.413 271.097C267.821 278.893 428.716 336.75 431.966 380.656C435.216 424.562 424.246 426.204 365.739 439.745C307.232 453.286 202 460.672 202 483.651V593.21C202 635.885 299.512 737.648 352.331 748.317C405.15 758.985 501.443 786.068 558.326 748.317C615.208 710.566 635.116 637.116 677.372 573.514C719.627 509.912 814.701 591.979 847.612 646.553C880.522 701.128 844.767 792.633 903.275 816.843C961.782 841.052 1014.6 841.052 1041.42 816.843C1068.23 792.633 1171.03 722.466 1196.62 716.31C1222.22 710.155 1196.62 439.745 1196.62 407.739C1196.62 375.732 1227.1 296.948 1162.09 271.097C1097.08 245.246 972.346 237.449 972.346 237.449L790.323 228.422Z"
            stroke="#1E1E1E"
            strokeOpacity="0.8"
            strokeWidth="210"
            shapeRendering="crispEdges"
          />
        </g>
        <path
          d="M794.5 229.152H611.145C578.234 229.152 225.565 150.368 213.783 189.76C202 229.152 241.005 264.031 254.413 271.827C267.821 279.624 428.716 337.481 431.966 381.387C435.216 425.293 424.246 426.934 365.739 440.475C307.232 454.016 202 461.402 202 484.381V593.94C202 636.615 299.512 738.378 352.331 749.047C405.15 759.715 501.443 786.798 558.326 749.047C615.208 711.296 635.116 637.846 677.372 574.244C719.627 510.643 814.701 592.709 847.612 647.284C880.522 701.858 844.767 793.363 903.275 817.573C961.782 841.783 1014.6 841.783 1041.42 817.573C1068.23 793.363 1171.03 723.196 1196.62 717.041C1222.22 710.886 1196.62 440.475 1196.62 408.469C1196.62 376.463 1227.1 297.678 1162.09 271.827C1097.08 245.976 972.346 238.18 972.346 238.18L794.5 229.152Z"
          stroke="#676464"
          strokeWidth="200"
        />
        <path
          d="M794.5 229.152H611.145C578.234 229.152 225.565 150.368 213.783 189.76C202 229.152 241.005 264.031 254.413 271.827C267.821 279.624 428.716 337.481 431.966 381.387C435.216 425.293 424.246 426.934 365.739 440.475C307.232 454.016 202 461.402 202 484.381V593.94C202 636.615 299.512 738.378 352.331 749.047C405.15 759.715 501.443 786.798 558.326 749.047C615.208 711.296 635.116 637.846 677.372 574.244C719.627 510.643 814.701 592.709 847.612 647.284C880.522 701.858 844.767 793.363 903.275 817.573C961.782 841.783 1014.6 841.783 1041.42 817.573C1068.23 793.363 1171.03 723.196 1196.62 717.041C1222.22 710.886 1196.62 440.475 1196.62 408.469C1196.62 376.463 1227.1 297.678 1162.09 271.827C1097.08 245.976 972.346 238.18 972.346 238.18L794.5 229.152Z"
          stroke="black"
          strokeOpacity="0.2"
          strokeWidth="200"
        />
        <path
          d="M272 692.5L415 776L533.5 763L613 666.5L702 563L807.5 596.5L865 742.5L935 822L1046.5 805.5L1131.5 763L1198 678L1207.5 526V402L1170.5 281.5L1046.5 244.5L837 220.069L585 205.569L453.5 196.5L266.5 189L231.5 265L405.5 383.5L253.5 466.5L194.5 563L272 692.5Z"
          stroke="#E9E4E4"
          strokeWidth="10"
          strokeMiterlimit={16}
          strokeDasharray="40 40"
        />
        <rect
          x="709"
          y="128.181"
          width="73.9999"
          height="204.819"
          fill="#FFFCFC"
        />
        <rect
          x="746.416"
          y="128.181"
          width="36.5842"
          height="42.1989"
          fill="#1E1E1E"
        />
        <rect
          x="709.831"
          y="170.38"
          width="36.5842"
          height="42.1989"
          fill="#1E1E1E"
        />
        <rect
          x="746.416"
          y="212.579"
          width="36.5842"
          height="42.1989"
          fill="#1E1E1E"
        />
        <rect
          x="709.831"
          y="254.778"
          width="36.5842"
          height="42.1989"
          fill="#1E1E1E"
        />
        <rect
          x="746.416"
          y="290.801"
          width="36.5842"
          height="42.1989"
          fill="#1E1E1E"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_1_3"
          x="93"
          y="72.9977"
          width="1224"
          height="875.002"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_3"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_3"
            result="shape"
          />
        </filter>
        <clipPath id="clip0_1_3">
          <rect width="1440" height="1024" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default RaceTrack;
