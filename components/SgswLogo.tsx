/**
 * SgswLogo.tsx
 * 
 * Logo der St.Galler Stadtwerke (sgsw).
 * Platzhalter-SVG - kann später durch offizielles Logo ersetzt werden.
 */

interface SgswLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function SgswLogo({ 
  className = "", 
  width = 32, 
  height = 32 
}: SgswLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hintergrund-Kreis */}
      <circle cx="50" cy="50" r="48" fill="#00A0E3" />
      
      {/* Text "sgsw" */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill="white"
        fontSize="24"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        sgsw
      </text>
    </svg>
  );
}
