import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Wallpaper,
  Image,
  Type,
  Volume2,
  Download,
  Video,
  Clock,
  Lock,
  Eye,
  Trash2,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ChatSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export const ChatSettingsSheet = ({ isOpen, onClose, defaultTab = 'appearance' }: ChatSettingsSheetProps) => {
  const [fontSize, setFontSize] = useState([16]);
  const [autoDownload, setAutoDownload] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [chatLock, setChatLock] = useState(false);
  const [sounds, setSounds] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('teal');
  const [selectedWallpaper, setSelectedWallpaper] = useState('default');
  const [bubbleStyle, setBubbleStyle] = useState('rounded');
  const [mediaQuality, setMediaQuality] = useState('high');

  const themes = [
    { id: 'teal', name: 'Teal Wave', color: 'bg-[hsl(174,72%,42%)]' },
    { id: 'purple', name: 'Purple Dream', color: 'bg-[hsl(271,76%,53%)]' },
    { id: 'blue', name: 'Ocean Blue', color: 'bg-[hsl(217,91%,60%)]' },
    { id: 'pink', name: 'Sunset Pink', color: 'bg-[hsl(340,82%,52%)]' },
    { id: 'green', name: 'Forest Green', color: 'bg-[hsl(142,76%,36%)]' },
    { id: 'orange', name: 'Warm Orange', color: 'bg-[hsl(24,95%,53%)]' },
  ];

  const wallpapers = [
    { id: 'default', name: 'Default', gradient: 'bg-gradient-to-br from-background to-muted' },
    { id: 'waves', name: 'Waves', gradient: 'bg-gradient-to-br from-primary/10 via-accent/10 to-background' },
    { id: 'sunset', name: 'Sunset', gradient: 'bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-500/20' },
    { id: 'forest', name: 'Forest', gradient: 'bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20' },
    { id: 'midnight', name: 'Midnight', gradient: 'bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[540px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-2xl font-bold">Chat Customization</SheetTitle>
          <SheetDescription>
            Personalize your chat experience with themes, sounds, and privacy settings
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full justify-start px-6 bg-transparent border-b rounded-none h-auto p-0">
            <TabsTrigger value="appearance" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Appearance
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Media
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Privacy
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="px-6 py-6 space-y-6">
              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-6 mt-0">
                {/* Themes */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Chat Theme</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          selectedTheme === theme.id
                            ? 'border-primary shadow-lg shadow-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`h-16 rounded-lg ${theme.color} mb-2`} />
                        <p className="text-xs font-medium text-center">{theme.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Wallpapers */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Wallpaper className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Chat Wallpaper</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {wallpapers.map((wallpaper) => (
                      <button
                        key={wallpaper.id}
                        onClick={() => setSelectedWallpaper(wallpaper.id)}
                        className={`relative h-24 rounded-xl border-2 transition-all hover:scale-105 ${wallpaper.gradient} ${
                          selectedWallpaper === wallpaper.id
                            ? 'border-primary shadow-lg shadow-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-sm font-medium bg-background/80 px-3 py-1 rounded-full">
                            {wallpaper.name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Bubble Style */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Message Bubble Style</h3>
                  </div>
                  <RadioGroup value={bubbleStyle} onValueChange={setBubbleStyle}>
                    <div className="grid grid-cols-3 gap-3">
                      <Label
                        htmlFor="rounded"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                          bubbleStyle === 'rounded'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="rounded" id="rounded" className="sr-only" />
                        <div className="w-full h-12 bg-primary rounded-2xl" />
                        <span className="text-xs font-medium">Rounded</span>
                      </Label>
                      
                      <Label
                        htmlFor="square"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                          bubbleStyle === 'square'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="square" id="square" className="sr-only" />
                        <div className="w-full h-12 bg-primary rounded-md" />
                        <span className="text-xs font-medium">Square</span>
                      </Label>
                      
                      <Label
                        htmlFor="minimal"
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                          bubbleStyle === 'minimal'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="minimal" id="minimal" className="sr-only" />
                        <div className="w-full h-12 bg-primary rounded-sm" />
                        <span className="text-xs font-medium">Minimal</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Font Size */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Message Font Size</h3>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{fontSize[0]}px</span>
                  </div>
                  <div className="space-y-4">
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={12}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Small</span>
                      <span>Medium</span>
                      <span>Large</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p style={{ fontSize: `${fontSize[0]}px` }} className="text-foreground">
                      This is a preview of your message text
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6 mt-0">
                {/* Chat Sounds */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Volume2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Chat Sounds</p>
                      <p className="text-sm text-muted-foreground">Play sounds for messages</p>
                    </div>
                  </div>
                  <Switch checked={sounds} onCheckedChange={setSounds} />
                </div>

                {/* Auto Download */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Download className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Auto-Download Media</p>
                      <p className="text-sm text-muted-foreground">Automatically save images and videos</p>
                    </div>
                  </div>
                  <Switch checked={autoDownload} onCheckedChange={setAutoDownload} />
                </div>

                <Separator />

                {/* Media Quality */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Media Quality</h3>
                  </div>
                  <RadioGroup value={mediaQuality} onValueChange={setMediaQuality} className="space-y-3">
                    <Label
                      htmlFor="low"
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        mediaQuality === 'low'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div>
                        <RadioGroupItem value="low" id="low" className="sr-only" />
                        <p className="font-medium">Low Quality</p>
                        <p className="text-sm text-muted-foreground">Faster, uses less data</p>
                      </div>
                    </Label>
                    
                    <Label
                      htmlFor="high"
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        mediaQuality === 'high'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div>
                        <RadioGroupItem value="high" id="high" className="sr-only" />
                        <p className="font-medium">High Quality</p>
                        <p className="text-sm text-muted-foreground">Best quality, uses more data</p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Message Timer */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Disappearing Messages</h3>
                  </div>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    Set Default Timer
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Set messages to automatically delete after a certain time
                  </p>
                </div>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-6 mt-0">
                {/* Chat Lock */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Lock className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">Chat Lock</p>
                      <p className="text-sm text-muted-foreground">Require authentication to open chats</p>
                    </div>
                  </div>
                  <Switch checked={chatLock} onCheckedChange={setChatLock} />
                </div>

                {/* Read Receipts */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Read Receipts</p>
                      <p className="text-sm text-muted-foreground">Let others see when you've read messages</p>
                    </div>
                  </div>
                  <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
                </div>

                <Separator />

                {/* Clear Data */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    <h3 className="text-lg font-semibold text-destructive">Clear Chat Data</h3>
                  </div>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Downloaded Media
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete All Messages
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Warning: These actions cannot be undone
                  </p>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
