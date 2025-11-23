import { useState, useEffect } from 'react';
import { Plus, MessageCircle, Gamepad2, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FabAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Close FAB when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle scroll to hide/show FAB
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsScrollingDown(true);
      } else {
        setIsScrollingDown(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleActionClick = (action: () => void) => {
    setIsOpen(false);
    setTimeout(action, 50);
  };

  const handleNewPost = () => {
    if (location.pathname === '/') {
      // Already on home, just trigger the event
      window.dispatchEvent(new Event('open-new-post'));
    } else {
      // Navigate to home first, then trigger after a delay
      navigate('/');
      setTimeout(() => {
        window.dispatchEvent(new Event('open-new-post'));
      }, 300);
    }
  };

  const actions: FabAction[] = [
    {
      icon: <MessageCircle className="h-6 w-6" />,
      label: 'New Post',
      onClick: () => handleActionClick(handleNewPost),
      color: 'bg-primary'
    },
    {
      icon: <Send className="h-6 w-6" />,
      label: 'Transfer Nexa',
      onClick: () => handleActionClick(() => navigate('/transfer')),
      color: 'bg-accent'
    },
    {
      icon: <Gamepad2 className="h-6 w-6" />,
      label: 'Play Games',
      onClick: () => handleActionClick(() => navigate('/games')),
      color: 'bg-primary'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className={cn(
        "fixed bottom-20 right-6 z-50 transition-transform duration-300",
        isScrollingDown ? "translate-y-32" : "translate-y-0"
      )}>
        {!isOpen ? (
          /* Main FAB Button */
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl transition-all bg-primary hover:bg-primary/90 hover:scale-110 text-primary-foreground"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        ) : (
          /* Action Buttons */
          <div className="flex flex-col-reverse items-end gap-4">
            {actions.map((action, index) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-4 animate-scale-in group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-foreground text-lg font-semibold whitespace-nowrap bg-card px-3 py-1 rounded-full shadow-lg">
                  {action.label}
                </span>
                <div className={cn(
                  "h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-110",
                  action.color
                )}>
                  {action.icon}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingActionButton;
