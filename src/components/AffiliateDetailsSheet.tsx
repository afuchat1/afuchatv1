import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Building2, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface AffiliateDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  businessName: string;
  affiliatedDate: string;
  businessLogo?: string;
}

export function AffiliateDetailsSheet({
  open,
  onOpenChange,
  userName,
  businessName,
  affiliatedDate,
  businessLogo,
}: AffiliateDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Affiliate Verification
          </SheetTitle>
          <SheetDescription>
            Details about this user's affiliation
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3">
            {businessLogo ? (
              <img 
                src={businessLogo} 
                alt={businessName}
                className="h-12 w-12 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Affiliated Business</p>
              <p className="font-semibold text-foreground">{businessName}</p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">User</p>
              <p className="text-sm text-muted-foreground">{userName}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground">Verification Reason</p>
              <p className="text-sm text-muted-foreground">
                This user is verified as an official affiliate of <span className="font-semibold text-foreground">{businessName}</span>
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Affiliated Since</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(affiliatedDate), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
