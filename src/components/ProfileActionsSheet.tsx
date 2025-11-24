import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetClose 
} from '@/components/ui/sheet';
import { LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';

interface ProfileActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
}

const ProfileActionsSheet = ({ isOpen, onClose, onLogout, onEditProfile }: ProfileActionsSheetProps) => {
  const navigate = useNavigate();
  const { openSettings } = useSettings();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="max-h-[85vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-border/50 p-6"
      >
        <div className="space-y-3">
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base hover:bg-muted/80 rounded-xl font-medium"
              onClick={onEditProfile}
            >
              <User className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Edit Profile</span>
            </Button>
          </SheetClose>

          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base hover:bg-muted/80 rounded-xl font-medium"
              onClick={() => { onClose(); openSettings(); }}
            >
              <Settings className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Settings</span>
            </Button>
          </SheetClose>

          <SheetClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base text-destructive hover:bg-destructive/10 rounded-xl font-medium"
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
