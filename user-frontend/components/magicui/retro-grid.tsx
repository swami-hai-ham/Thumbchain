import { cn } from "@/lib/utils";

export default function RetroGrid({
  className,
  angle = -30,
}: {
  className?: string;
  angle?: number;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none relative w-full h-48 overflow-hidden opacity-100 [perspective:200px] -z-50",
        className,
      )}
      style={{ "--grid-angle": `${angle}deg` , top:"0px", 
        boxShadow: "inset 0px 10px 50px rgba(0, 0, 0, 0.7)", // Shadow for inner depth
        maskImage: "linear-gradient(to bottom, transparent, black 50%, black 80%, transparent)", // Gradient mask to soften the grid edges
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 50%, black 80%, transparent)", // Cross-browser compatibility for mask
      } as React.CSSProperties}
    >
      {/* Grid */}
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-grid",

            "[background-repeat:repeat] [background-size:100px_100px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",

            // Light Styles
            "[background-image:linear-gradient(to_right,rgba(0,255,133,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(0,255,133,0.3)_1px,transparent_0)]",

            // Dark styles
            "dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.3)_1px,transparent_0)]",

          )}
        />
      </div>

      {/* Background Gradient */}
      <div className="absolute inset-0" />
    </div>
  );
}
