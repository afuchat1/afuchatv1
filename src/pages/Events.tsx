import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, Ticket, MapPin, Clock, Users, Star, TrendingUp, Heart } from 'lucide-react';
import { toast } from 'sonner';

const events = [
  {
    id: '1',
    title: 'Summer Music Festival',
    date: 'June 15-17, 2025',
    location: 'Central Park',
    price: '150',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop',
    rating: 4.9,
    attendees: '5K+',
    featured: true,
    description: 'Three days of non-stop music featuring top artists'
  },
  {
    id: '2',
    title: 'Tech Conference 2025',
    date: 'July 20-22, 2025',
    location: 'Convention Center',
    price: '300',
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
    rating: 4.8,
    attendees: '2K+',
    featured: true,
    description: 'Latest innovations and networking opportunities'
  },
  {
    id: '3',
    title: 'Food & Wine Expo',
    date: 'Aug 10-12, 2025',
    location: 'Downtown Arena',
    price: '80',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop',
    rating: 4.7,
    attendees: '3K+',
    featured: false,
    description: 'Taste exceptional wines and culinary delights'
  },
  {
    id: '4',
    title: 'Art Gallery Opening',
    date: 'Sep 5, 2025',
    location: 'Metropolitan Museum',
    price: '50',
    category: 'Art',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop',
    rating: 4.6,
    attendees: '500+',
    featured: false,
    description: 'Exclusive preview of contemporary art collection'
  },
  {
    id: '5',
    title: 'Sports Championship',
    date: 'Oct 15, 2025',
    location: 'Stadium',
    price: '200',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop',
    rating: 4.9,
    attendees: '10K+',
    featured: true,
    description: 'Experience the thrill of championship finals'
  },
  {
    id: '6',
    title: 'Comedy Night',
    date: 'Nov 8, 2025',
    location: 'Comedy Club',
    price: '40',
    category: 'Comedy',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&h=400&fit=crop',
    rating: 4.7,
    attendees: '300+',
    featured: false,
    description: 'An evening of laughter with top comedians'
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

  const featuredEvents = filteredEvents.filter(e => e.featured);
  const regularEvents = filteredEvents.filter(e => !e.featured);

  const handleBookTicket = (eventTitle: string, eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Ticket className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Events & Tickets</h1>
          </div>
          <p className="text-muted-foreground text-lg">Discover and book amazing events near you</p>
        </div>
      </div>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search events, venues, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
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
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="upcoming" className="text-sm md:text-base">Upcoming</TabsTrigger>
            <TabsTrigger value="popular" className="text-sm md:text-base">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="nearby" className="text-sm md:text-base">Nearby</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6 mt-6">
            {/* Featured Events */}
            {featuredEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-xl font-bold">Featured Events</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                      onClick={() => handleBookTicket(event.title, event.id.toString())}
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="secondary" className="mb-2">{event.category}</Badge>
                            <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground my-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            {event.location}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {event.attendees} attending
                            </div>
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {event.rating}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-xl font-bold text-primary">{event.price} Nexa</span>
                          <Button size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleBookTicket(event.title, event.id.toString());
                          }} className="gap-2">
                            <Ticket className="h-4 w-4" />
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* All Events */}
            {regularEvents.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">All Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => handleBookTicket(event.title, event.id.toString())}
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
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
                        
                        <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
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
                          <span className="text-lg font-bold text-primary">{event.price} Nexa</span>
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            handleBookTicket(event.title, event.id.toString());
                          }}>
                            <Ticket className="h-4 w-4 mr-2" />
                            Book
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg">No events found</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            <div className="text-center py-16">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Popular Events</h3>
              <p className="text-muted-foreground">Check back soon for trending events!</p>
            </div>
          </TabsContent>

          <TabsContent value="nearby" className="mt-6">
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Events Near You</h3>
              <p className="text-muted-foreground mb-4">Enable location to see events nearby</p>
              <Button>Enable Location</Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Events;
