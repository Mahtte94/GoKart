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
      <rect width="1440" height="1024" fill="white" />
      <path
        d="M821.268 181.862H608.605C569.545 181.862 150.969 88.3278 136.985 135.095C123 181.862 169.294 223.27 185.208 232.526C201.121 241.782 392.084 310.471 395.942 362.597C399.8 414.722 386.779 416.671 317.338 432.747C247.897 448.823 123 457.592 123 484.873V614.944C123 665.608 238.735 786.422 301.425 799.088C364.115 811.754 478.403 843.907 545.915 799.088C613.427 754.27 637.057 667.069 687.208 591.56C737.36 516.051 850.202 613.482 889.263 678.273C928.323 743.065 885.887 851.701 955.328 880.443C1024.77 909.186 1087.46 909.186 1119.29 880.443C1151.11 851.701 1273.12 768.397 1303.5 761.09C1333.88 753.783 1303.5 432.747 1303.5 394.749C1303.5 356.751 1339.66 263.217 1262.51 232.526C1185.35 201.835 1037.31 192.579 1037.31 192.579L821.268 181.862Z"
        stroke="#676464"
        strokeWidth="200"
      />
      <rect x="746" y="81" width="89" height="199" fill="#FFFCFC" />
      <rect x="791" y="81" width="44" height="41" fill="#1E1E1E" />
      <rect x="747" y="122" width="44" height="41" fill="#1E1E1E" />
      <rect x="791" y="163" width="44" height="41" fill="#1E1E1E" />
      <rect x="747" y="204" width="44" height="41" fill="#1E1E1E" />
      <rect x="791" y="239" width="44" height="41" fill="#1E1E1E" />
    </svg>
  );
}

export default RaceTrack;
