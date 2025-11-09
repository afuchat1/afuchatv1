import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetClose 
} from '@/components/ui/sheet';
import { LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
}

const ProfileActionsSheet = ({ isOpen, onClose, onLogout, onEditProfile }: ProfileActionsSheetProps) => {
  const navigate = useNavigate();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-auto rounded-t-2xl p-0 border-t border-border"
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 border-b border-border">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-4 py-2">
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start py-4 h-auto text-base hover:bg-muted/80 rounded-lg"
              onClick={onEditProfile}
            >
              <User className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Edit Profile</span>
            </Button>
          </SheetClose>

          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start py-4 h-auto text-base hover:bg-muted/80 rounded-lg"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Settings</span>
            </Button>
          </SheetClose>

          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start py-4 h-auto text-base text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Log Out</span>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileActionsSheet;
