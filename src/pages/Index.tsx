import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MessageSquare, Radio, ShoppingBag, Sparkles, Shield, Zap, Users, Mail, Globe, ExternalLink, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import Feed from './Feed';
import DesktopFeed from './DesktopFeed';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // If user is logged in, hide landing and show feed directly
    if (user) {
      setShowLanding(false);
    }
  }, [user]);

  const features = [
    {
      icon: Radio,
      title: "Social Feed",
      description: "Share your thoughts, photos, and moments with your network. Stay updated with trending posts and connect with friends."
    },
    {
      icon: MessageSquare,
      title: "Private Messaging",
      description: "Secure end-to-end encrypted messaging with voice notes, file sharing, and group chats. Your conversations, your privacy."
    },
    {
      icon: ShoppingBag,
      title: "Marketplace",
      description: "Discover unique gifts and items in our integrated marketplace. Buy and sell with complete trust and security."
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Meet AfuAI, your intelligent companion. Get instant help, generate content, and enhance your experience with cutting-edge AI."
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Bank-level encryption, secure authentication with Google OAuth, and robust data protection for your peace of mind."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join a vibrant community of creators, businesses, and users. Build connections that matter."
    }
  ];

  // Show feed directly for authenticated users or when landing is dismissed
  if (!showLanding || user) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="AfuChat — All-in-One Social Platform | Connect, Chat, Shop & More"
          description="AfuChat is a comprehensive social platform combining social networking, secure messaging, marketplace shopping, and AI assistance. Join our community to connect with friends, share moments, chat privately, discover unique gifts, and experience the future of social interaction."
          keywords="social media, messaging app, chat platform, marketplace, AI assistant, social networking, secure messaging, online community, social commerce, group chat, private messaging, social platform"
        />
        {!user && (
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <Logo size="md" />
                  <h1 className="text-xl font-bold text-foreground">AfuChat</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => navigate('/auth/signin')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth/signup')}>
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          </header>
        )}
        {isMobile ? <Feed guestMode={!user} /> : <DesktopFeed guestMode={!user} />}
      </div>
    );
  }

  // Landing page for first-time visitors
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="AfuChat — All-in-One Social Platform | Connect, Chat, Shop & More"
        description="AfuChat is a comprehensive social platform combining social networking, secure messaging, marketplace shopping, and AI assistance. Join our community to connect with friends, share moments, chat privately, discover unique gifts, and experience the future of social interaction."
        keywords="social media, messaging app, chat platform, marketplace, AI assistant, social networking, secure messaging, online community, social commerce, group chat, private messaging, social platform"
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <h1 className="text-xl font-bold text-foreground">AfuChat</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/auth/signin')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth/signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">All-in-One Social Platform</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Connect, Share, Chat,<br />and Shop in One Place
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              AfuChat brings together everything you need for modern social interaction. Post updates, message privately, discover unique items, and get AI-powered assistance — all on one secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-base h-12 px-8" onClick={() => navigate('/auth/signup')}>
                Create Free Account
              </Button>
              <Button size="lg" variant="outline" className="text-base h-12 px-8" onClick={() => setShowLanding(false)}>
                Browse Feed
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything You Need in One Platform
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for seamless social interaction, secure communication, and community building.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 bg-background/50 backdrop-blur">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl sm:text-4xl font-bold text-foreground">
                Built for Modern Connection
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  AfuChat is a next-generation social platform that combines the best features of social media, private messaging, e-commerce, and artificial intelligence into one unified experience.
                </p>
                <p>
                  Founded with the mission to create meaningful digital connections, AfuChat serves millions of users worldwide who want a secure, feature-rich platform for all their social and communication needs.
                </p>
                <p>
                  Whether you're sharing life updates, chatting with friends, discovering unique marketplace items, or getting AI assistance, AfuChat provides the tools you need in a clean, intuitive interface.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4 text-foreground">Why Choose AfuChat?</h4>
                  <ul className="space-y-3">
                    {[
                      "100% free to use with premium options",
                      "Bank-level security and encryption",
                      "Cross-platform compatibility",
                      "Regular updates and new features",
                      "24/7 customer support",
                      "Active community of millions"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Developer Information */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground">
              Get in Touch
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions? Need support? Want to partner with us? Our team is here to help.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">Email Support</h4>
                <p className="text-sm text-muted-foreground">Get help from our support team</p>
                <a 
                  href="mailto:support@afuchat.com" 
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                >
                  support@afuchat.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">Business Inquiries</h4>
                <p className="text-sm text-muted-foreground">Partnership and business opportunities</p>
                <a 
                  href="mailto:business@afuchat.com" 
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                >
                  business@afuchat.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">Developer Team</h4>
                <p className="text-sm text-muted-foreground">Technical support and API access</p>
                <a 
                  href="mailto:developers@afuchat.com" 
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                >
                  developers@afuchat.com
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Company Information */}
          <Card className="mt-12 border-border/50 bg-background/50 backdrop-blur">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold mb-2 text-foreground">AfuChat Platform Team</h4>
                  <p className="text-muted-foreground">
                    AfuChat is developed and maintained by a dedicated team of engineers, designers, and community managers committed to creating the best social experience possible.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-6 pt-4">
                  <div>
                    <h5 className="font-semibold mb-2 text-foreground">Platform Information</h5>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><span className="font-medium">Service:</span> AfuChat Social Platform</li>
                      <li><span className="font-medium">Type:</span> Social Networking & Communication</li>
                      <li><span className="font-medium">Headquarters:</span> Global Operations</li>
                      <li><span className="font-medium">Launched:</span> 2024</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2 text-foreground">Support Channels</h5>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Email: support@afuchat.com</li>
                      <li>• Business: business@afuchat.com</li>
                      <li>• Developers: developers@afuchat.com</li>
                      <li>• Response time: 24-48 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            <CardContent className="p-12 text-center space-y-6">
              <h3 className="text-3xl sm:text-4xl font-bold text-foreground">
                Ready to Get Started?
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join millions of users who trust AfuChat for their social networking, messaging, and shopping needs.
              </p>
              <Button size="lg" className="text-base h-12 px-8" onClick={() => navigate('/auth/signup')}>
                Create Your Free Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="font-bold text-foreground">AfuChat</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your all-in-one social platform for connecting, chatting, and shopping.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4 text-foreground">Platform</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/auth/signup" className="hover:text-primary">Sign Up</a></li>
                <li><a href="/auth/signin" className="hover:text-primary">Sign In</a></li>
                <li><a href="/support" className="hover:text-primary">Support</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4 text-foreground">Legal</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4 text-foreground">Contact</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@afuchat.com" className="hover:text-primary">support@afuchat.com</a></li>
                <li><a href="mailto:business@afuchat.com" className="hover:text-primary">business@afuchat.com</a></li>
                <li><a href="mailto:developers@afuchat.com" className="hover:text-primary">developers@afuchat.com</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} AfuChat. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
