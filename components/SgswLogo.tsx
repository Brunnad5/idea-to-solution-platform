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
      xmlns="http://www.w3.org/2000/svg"
      id="Ebene_1"
      version="1.1"
      viewBox="0 0 63.91 32"
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <path fill="#e1062c" d="M37.28.02H21.3L0 31.98h15.98z"></path>
      <path fill="#070d15" d="M63.91.02H47.93l-21.3 31.96h15.98z"></path>
    </svg>
  );
}
