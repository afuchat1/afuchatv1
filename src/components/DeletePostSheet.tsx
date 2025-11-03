import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetClose,
  SheetDescription 
} from '@/components/ui/sheet';
import { Trash2, X } from 'lucide-react';

interface DeletePostSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const DeletePostSheet = ({ isOpen, onClose, onConfirm, isDeleting = false }: DeletePostSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-auto rounded-t-2xl p-0 border-t border-border"
      >
        <div className="px-6 py-5">
          <SheetHeader className="text-left space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">Delete Post?</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
            <SheetDescription className="text-muted-foreground text-sm">
              This can't be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from AfuChat search results.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={isDeleting}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold h-12 rounded-full"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>

            <SheetClose asChild>
              <Button
                variant="outline"
                className="w-full h-12 rounded-full font-bold border-border"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DeletePostSheet;
