import { useState, useEffect } from 'react';
import { Plus, MessageCircle, Zap, Gamepad2, Send, X } from 'lucide-react';
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
    // Small delay to ensure state updates before navigation
    setTimeout(action, 50);
  };

  const actions: FabAction[] = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: 'New Post',
      onClick: () => handleActionClick(() => {
        navigate('/');
        setTimeout(() => {
          window.dispatchEvent(new Event('open-new-post'));
        }, 100);
      }),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: <Send className="h-5 w-5" />,
      label: 'Transfer XP',
      onClick: () => handleActionClick(() => navigate('/transfer')),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: <Gamepad2 className="h-5 w-5" />,
      label: 'Play Games',
      onClick: () => handleActionClick(() => navigate('/services')),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: 'Quick Chat',
      onClick: () => handleActionClick(() => navigate('/chats')),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-20 right-6 z-50 flex flex-col-reverse items-end gap-3">
        {/* Action Buttons */}
        {isOpen && actions.map((action, index) => (
          <div
            key={action.label}
            className="flex items-center gap-3 animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="bg-background text-foreground px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap border border-border">
              {action.label}
            </span>
            <Button
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full shadow-lg transition-all hover:scale-110",
                action.color
              )}
              onClick={action.onClick}
            >
              {action.icon}
            </Button>
          </div>
        ))}

        {/* Main FAB Button */}
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all hover:scale-110",
            isOpen ? "bg-destructive hover:bg-destructive/90 rotate-45" : "bg-primary hover:bg-primary/90"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
};

export default FloatingActionButton;
