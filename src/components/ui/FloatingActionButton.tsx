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
  const navigate = useNavigate();
  const location = useLocation();

  // Close FAB when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

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
      color: 'bg-blue-500'
    },
    {
      icon: <Send className="h-6 w-6" />,
      label: 'Transfer XP',
      onClick: () => handleActionClick(() => navigate('/transfer')),
      color: 'bg-green-500'
    },
    {
      icon: <Gamepad2 className="h-6 w-6" />,
      label: 'Play Games',
      onClick: () => handleActionClick(() => navigate('/services')),
      color: 'bg-purple-500'
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
      <div className="fixed bottom-20 right-6 z-50 flex flex-col-reverse items-end gap-4">
        {/* Action Buttons */}
        {isOpen && actions.map((action, index) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex items-center gap-4 animate-scale-in group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="text-white text-lg font-semibold whitespace-nowrap">
              {action.label}
            </span>
            <div className={cn(
              "h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform group-hover:scale-110",
              action.color
            )}>
              {action.icon}
            </div>
          </button>
        ))}

        {/* Main FAB Button */}
        <Button
          size="icon"
          className={cn(
            "h-16 w-16 rounded-full shadow-2xl transition-all",
            isOpen 
              ? "bg-primary hover:bg-primary/90 rotate-45" 
              : "bg-primary hover:bg-primary/90 hover:scale-110"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Plus className="h-7 w-7" />
        </Button>
      </div>
    </>
  );
};

export default FloatingActionButton;
