import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { BadgeCheck, ShieldCheck, Calendar } from "lucide-react";
import { format } from "date-fns";

interface VerifiedDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  isVerified: boolean;
  isOrgVerified: boolean;
  createdAt?: string;
}

export function VerifiedDetailsSheet({
  open,
  onOpenChange,
  userName,
  isVerified,
  isOrgVerified,
  createdAt,
}: VerifiedDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[90vh] rounded-t-3xl border-t touch-pan-y"
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          const startY = e.clientY;
          const sheetContent = target.closest('[role="dialog"]') as HTMLElement;
          
          const handlePointerMove = (e: PointerEvent) => {
            const currentY = e.clientY;
            const diff = currentY - startY;
            
            if (diff > 0 && sheetContent) {
              sheetContent.style.transform = `translateY(${diff}px)`;
            }
          };
          
          const handlePointerUp = (e: PointerEvent) => {
            const currentY = e.clientY;
            const diff = currentY - startY;
            
            if (diff > 100) {
              onOpenChange(false);
            }
            
            if (sheetContent) {
              sheetContent.style.transform = '';
            }
            
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
          };
          
          document.addEventListener('pointermove', handlePointerMove);
          document.addEventListener('pointerup', handlePointerUp);
        }}
      >
        {/* Drag indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/30 rounded-full cursor-grab active:cursor-grabbing" />
        
        <div className="pt-8 pb-6 px-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">Verified account</h2>
          </div>
          
          {/* Verification Info */}
          <div className="space-y-6">
            {/* Main verification reason */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                {isOrgVerified ? (
                  <ShieldCheck className="w-7 h-7 text-primary" />
                ) : (
                  <BadgeCheck className="w-7 h-7 text-primary" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-base leading-relaxed text-foreground">
                  {isOrgVerified ? (
                    <>This account is verified because it's an official organization on AfuChat.</>
                  ) : (
                    <>This account is verified because it's a notable account on AfuChat.</>
                  )}
                </p>
              </div>
            </div>

            {/* Account type */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center mt-1">
                {isOrgVerified ? (
                  <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <BadgeCheck className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-base leading-relaxed text-foreground">
                  This account is {isOrgVerified ? 'organization' : 'user'} verified.
                </p>
              </div>
            </div>

            {/* Joined date */}
            {createdAt && (
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center mt-1">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-base leading-relaxed text-foreground">
                    Joined {format(new Date(createdAt), "MMMM yyyy")}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}