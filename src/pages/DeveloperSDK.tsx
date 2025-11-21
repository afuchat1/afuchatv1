import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Code, Book, Rocket, Download, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

const DeveloperSDK = () => {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exampleCode = {
    basic: `// Basic Mini Program Structure
import { AfuSDK } from '@afuchat/sdk';

const sdk = new AfuSDK({
  appId: 'your-app-id',
  appSecret: 'your-app-secret'
});

// Initialize your app
sdk.ready(() => {
  console.log('Mini program ready!');
  
  // Get user info
  const user = sdk.getUserInfo();
  console.log('Current user:', user);
});`,

    nexa: `// Nexa Integration Example
import { AfuSDK } from '@afuchat/sdk';

const sdk = new AfuSDK({ appId: 'your-app-id' });

// Award Nexa to user
async function awardPoints(amount: number) {
  try {
    const result = await sdk.nexa.award({
      amount: amount,
      reason: 'Game completion',
      metadata: {
        game: 'puzzle-master',
        level: 5
      }
    });
    
    console.log('Nexa awarded:', result);
  } catch (error) {
    console.error('Failed to award Nexa:', error);
  }
}

// Get user's Nexa balance
async function getBalance() {
  const balance = await sdk.nexa.getBalance();
  console.log('User Nexa:', balance);
}`,

    social: `// Social Features Example
import { AfuSDK } from '@afuchat/sdk';

const sdk = new AfuSDK({ appId: 'your-app-id' });

// Share content
async function shareGame() {
  await sdk.social.share({
    title: 'Check out my high score!',
    description: 'I just scored 10,000 points!',
    imageUrl: 'https://example.com/share.jpg',
    link: 'https://miniapp.afuchat.com/puzzle'
  });
}

// Get friends list
async function getFriends() {
  const friends = await sdk.social.getFriends();
  console.log('Friends:', friends);
}

// Send invite
async function inviteFriend(userId: string) {
  await sdk.social.invite(userId, {
    message: 'Join me in this game!'
  });
}`,

    storage: `// Data Storage Example
import { AfuSDK } from '@afuchat/sdk';

const sdk = new AfuSDK({ appId: 'your-app-id' });

// Save user data
async function saveProgress(data: any) {
  await sdk.storage.set('game_progress', data);
}

// Load user data
async function loadProgress() {
  const data = await sdk.storage.get('game_progress');
  return data;
}

// List all keys
async function listSaves() {
  const keys = await sdk.storage.keys();
  return keys;
}

// Delete data
async function deleteSave(key: string) {
  await sdk.storage.remove(key);
}`,

    ui: `// UI Components Example
import { AfuSDK } from '@afuchat/sdk';

const sdk = new AfuSDK({ appId: 'your-app-id' });

// Show toast notification
sdk.ui.showToast({
  message: 'Level completed!',
  type: 'success',
  duration: 3000
});

// Show loading
sdk.ui.showLoading('Processing...');
sdk.ui.hideLoading();

// Show confirmation dialog
const confirmed = await sdk.ui.confirm({
  title: 'Restart Game?',
  message: 'Your progress will be lost.',
  confirmText: 'Restart',
  cancelText: 'Cancel'
});

if (confirmed) {
  // Restart game
}

// Show custom modal
sdk.ui.showModal({
  title: 'Achievement Unlocked!',
  content: '<img src="trophy.png" /><p>Master Player</p>',
  buttons: [{
    text: 'Share',
    onClick: () => shareAchievement()
  }]
});`
  };

  const apiEndpoints = [
    { method: 'GET', endpoint: '/api/v1/user', description: 'Get current user info' },
    { method: 'GET', endpoint: '/api/v1/nexa/balance', description: 'Get user Nexa balance' },
    { method: 'POST', endpoint: '/api/v1/nexa/award', description: 'Award Nexa to user (requires approval)' },
    { method: 'GET', endpoint: '/api/v1/friends', description: 'Get user\'s friends list' },
    { method: 'POST', endpoint: '/api/v1/share', description: 'Share content to feed' },
    { method: 'POST', endpoint: '/api/v1/storage/set', description: 'Save user data' },
    { method: 'GET', endpoint: '/api/v1/storage/get', description: 'Retrieve user data' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
          <div className="container px-4">
            <div className="flex h-16 items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigate('/mini-programs')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Logo size="sm" />
              <div className="w-10" />
            </div>
          </div>
        </header>

        <main className="container px-4 py-8">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold">Mini Program SDK</h1>
            <p className="text-lg text-muted-foreground">
              Build powerful mini apps integrated with AfuChat
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg">
                <Download className="mr-2 h-4 w-4" />
                Download SDK
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://github.com/afuchat/mini-sdk" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <Book className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="quickstart">
                <Rocket className="mr-2 h-4 w-4" />
                Quick Start
              </TabsTrigger>
              <TabsTrigger value="examples">
                <Code className="mr-2 h-4 w-4" />
                Examples
              </TabsTrigger>
              <TabsTrigger value="api">
                <ExternalLink className="mr-2 h-4 w-4" />
                API Reference
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>What are Mini Programs?</CardTitle>
                  <CardDescription>
                    Mini programs are lightweight apps that run inside AfuChat without requiring installation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">✨ Key Features</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Instant load - no installation needed</li>
                        <li>• Access to Nexa system</li>
                        <li>• Social sharing capabilities</li>
                        <li>• User data storage</li>
                        <li>• Native UI components</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">🎯 Use Cases</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Games and puzzles</li>
                        <li>• Productivity tools</li>
                        <li>• Shopping experiences</li>
                        <li>• Educational content</li>
                        <li>• Entertainment apps</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SDK Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl mb-2">👤</div>
                      <h4 className="font-medium mb-1">User Auth</h4>
                      <p className="text-xs text-muted-foreground">
                        Seamless user authentication
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl mb-2">💎</div>
                      <h4 className="font-medium mb-1">Nexa Integration</h4>
                      <p className="text-xs text-muted-foreground">
                        Award and manage user Nexa
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl mb-2">📱</div>
                      <h4 className="font-medium mb-1">Social Features</h4>
                      <p className="text-xs text-muted-foreground">
                        Share, invite, and connect
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl mb-2">💾</div>
                      <h4 className="font-medium mb-1">Data Storage</h4>
                      <p className="text-xs text-muted-foreground">
                        Persistent user data
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl mb-2">🎨</div>
                      <h4 className="font-medium mb-1">UI Components</h4>
                      <p className="text-xs text-muted-foreground">
                        Native-looking interfaces
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl mb-2">⚡</div>
                      <h4 className="font-medium mb-1">Real-time Updates</h4>
                      <p className="text-xs text-muted-foreground">
                        Live data synchronization
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quick Start Tab */}
            <TabsContent value="quickstart" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Installation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Using npm:</p>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>npm install @afuchat/sdk</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyCode('npm install @afuchat/sdk', 'install-npm')}
                      >
                        {copiedCode === 'install-npm' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Using yarn:</p>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>yarn add @afuchat/sdk</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyCode('yarn add @afuchat/sdk', 'install-yarn')}
                      >
                        {copiedCode === 'install-yarn' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Basic Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{exampleCode.basic}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyCode(exampleCode.basic, 'basic')}
                    >
                      {copiedCode === 'basic' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Create a <code className="bg-muted px-1 rounded">afu.config.json</code> file in your project root:
                  </p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`{
  "appId": "your-app-id",
  "name": "My Mini Program",
  "version": "1.0.0",
  "description": "An awesome mini program",
  "category": "games",
  "permissions": [
    "user.info",
    "nexa.read",
    "nexa.award",
    "social.share",
    "storage.read",
    "storage.write"
  ],
  "pages": {
    "index": "/index.html",
    "game": "/game.html"
  }
}`}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyCode('config', 'config')}
                    >
                      {copiedCode === 'config' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-6">
              {Object.entries(exampleCode).slice(1).map(([key, code]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="capitalize">{key.replace('_', ' ')} Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                        <code>{code}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyCode(code, key)}
                      >
                        {copiedCode === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* API Reference Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>REST API Endpoints</CardTitle>
                  <CardDescription>
                    Base URL: <code className="bg-muted px-2 py-1 rounded">https://api.afuchat.com</code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <span className={`px-2 py-1 rounded text-xs font-mono ${
                          endpoint.method === 'GET' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="flex-1 text-sm">{endpoint.endpoint}</code>
                        <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    All API requests require authentication using your app credentials:
                  </p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`Authorization: Bearer YOUR_APP_TOKEN
X-App-ID: YOUR_APP_ID`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 border-b">
                      <span>Standard tier:</span>
                      <span className="font-medium">1,000 requests/hour</span>
                    </div>
                    <div className="flex justify-between p-2 border-b">
                      <span>Premium tier:</span>
                      <span className="font-medium">10,000 requests/hour</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span>Enterprise tier:</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default DeveloperSDK;
