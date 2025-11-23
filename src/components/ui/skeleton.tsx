import { CustomLoader } from "./CustomLoader";
import { cn } from "@/lib/utils";

// Backward-compatible Skeleton wrapper that uses CustomLoader
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // Return a simple placeholder that uses our loading animation
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <CustomLoader size="sm" />
    </div>
  );
}

export { Skeleton };
