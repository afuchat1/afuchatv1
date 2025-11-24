import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ShieldCheck, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface VerifiedDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  isVerified: boolean;
  isOrgVerified: boolean;
  createdAt?: string;
  viewerIsVerified?: boolean;
}

export function VerifiedDetailsSheet({
  open,
  onOpenChange,
  userName,
  isVerified,
  isOrgVerified,
  createdAt,
  viewerIsVerified = false,
}: VerifiedDetailsSheetProps) {
  const navigate = useNavigate();

  const handleGetVerified = () => {
    onOpenChange(false);
    navigate('/verification-request');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="max-h-[85vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-border/50 p-6 overflow-y-auto"
      >
        {/* Header */}
        <div className="mb-6">
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

            {/* How to get verified section - Only show if viewer is not verified */}
            {!viewerIsVerified && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Want to get verified?</h3>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-primary mt-0.5" />
                    <p>Be an active and notable member of the AfuChat community</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-primary mt-0.5" />
                    <p>Have a complete profile with authentic information</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-primary mt-0.5" />
                    <p>Businesses and influencers with established presence can apply</p>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-primary mt-0.5" />
                    <p>Provide supporting documents (business registration, social media links, etc.)</p>
                  </div>
                </div>

                <Button 
                  onClick={handleGetVerified}
                  className="w-full mt-4 h-12 font-semibold rounded-xl"
                  size="lg"
                >
                  Apply for Verification
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Applications are reviewed by our team. Processing may take 3-5 business days.
                </p>
              </div>
            )}
          </div>
      </SheetContent>
    </Sheet>
  );
}