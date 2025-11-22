import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Palette, Type, Layout } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Bright and clean' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follows device settings' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Theme</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 bg-muted/30'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 rounded-full ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Type className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Text & Display</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Font Size</p>
              <p className="text-sm text-muted-foreground">Adjust text size</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">A</Button>
              <Button variant="outline" size="sm" className="text-lg">A</Button>
              <Button variant="outline" size="sm" className="text-xl">A</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Layout className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Layout</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="font-medium mb-2">Compact Mode</p>
            <p className="text-sm text-muted-foreground mb-4">Show more content by reducing spacing</p>
            <Button variant="outline" size="sm">Coming Soon</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
