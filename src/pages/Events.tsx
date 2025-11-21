import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, Ticket, Calendar, MapPin, Clock, Users, Star } from 'lucide-react';
import { toast } from 'sonner';

const events = [
  {
    id: 1,
    title: 'Summer Music Festival',
    date: 'June 15-17, 2025',
    location: 'Central Park',
    price: '150',
    category: 'Music',
    image: '🎵',
    rating: 4.9,
    attendees: '5K+'
  },
  {
    id: 2,
    title: 'Tech Conference 2025',
    date: 'July 20-22, 2025',
    location: 'Convention Center',
    price: '300',
    category: 'Tech',
    image: '💻',
    rating: 4.8,
    attendees: '2K+'
  },
  {
    id: 3,
    title: 'Food & Wine Expo',
    date: 'Aug 10-12, 2025',
    location: 'Downtown Arena',
    price: '80',
    category: 'Food',
    image: '🍷',
    rating: 4.7,
    attendees: '3K+'
  },
  {
    id: 4,
    title: 'Art Gallery Opening',
    date: 'Sep 5, 2025',
    location: 'Metropolitan Museum',
    price: '50',
    category: 'Art',
    image: '🎨',
    rating: 4.6,
    attendees: '500+'
  },
  {
    id: 5,
    title: 'Sports Championship',
    date: 'Oct 15, 2025',
    location: 'Stadium',
    price: '200',
    category: 'Sports',
    image: '⚽',
    rating: 4.9,
    attendees: '10K+'
  },
  {
    id: 6,
    title: 'Comedy Night',
    date: 'Nov 8, 2025',
    location: 'Comedy Club',
    price: '40',
    category: 'Comedy',
    image: '😂',
    rating: 4.7,
    attendees: '300+'
  },
];

const categories = ['All', 'Music', 'Tech', 'Food', 'Art', 'Sports', 'Comedy'];

const Events = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBookTicket = (eventTitle: string) => {
    toast.success(`Booking ticket for ${eventTitle}...`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hidden lg:inline-flex">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-4 text-lg font-semibold">Events & Tickets</h1>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, venues, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-6xl">
                    {event.image}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge variant="secondary" className="mb-2">{event.category}</Badge>
                        <h3 className="font-semibold mb-1">{event.title}</h3>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {event.rating}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {event.attendees} attending
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">{event.price} XP</span>
                      <Button size="sm" onClick={() => handleBookTicket(event.title)}>
                        <Ticket className="h-4 w-4 mr-2" />
                        Book
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Popular events coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="nearby" className="mt-6">
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Enable location to see nearby events</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Events;
