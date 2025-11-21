import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, Plane, Hotel, Calendar, MapPin, Star, Users } from 'lucide-react';
import { toast } from 'sonner';

const flights = [
  { id: 1, from: 'NYC', to: 'LAX', price: '500', duration: '6h', airline: '✈️ SkyLine', rating: 4.8 },
  { id: 2, from: 'LON', to: 'PAR', price: '200', duration: '1h 30m', airline: '✈️ EuroJet', rating: 4.7 },
  { id: 3, from: 'TOK', to: 'SYD', price: '800', duration: '9h', airline: '✈️ Pacific Air', rating: 4.9 },
];

const hotels = [
  { id: 1, name: 'Grand Plaza Hotel', location: 'New York', price: '300', rating: 4.8, image: '🏨', amenities: ['WiFi', 'Pool', 'Gym'] },
  { id: 2, name: 'Beach Resort', location: 'Miami', price: '250', rating: 4.7, image: '🏖️', amenities: ['Beach', 'Spa', 'Restaurant'] },
  { id: 3, name: 'Mountain Lodge', location: 'Denver', price: '200', rating: 4.6, image: '🏔️', amenities: ['Hiking', 'Fireplace', 'View'] },
];

const Travel = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleBook = (type: string, name: string) => {
    toast.success(`Booking ${type}: ${name}...`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hidden lg:inline-flex">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-4 text-lg font-semibold">Travel & Hotels</h1>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="flights" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="flights" className="gap-2">
              <Plane className="h-4 w-4" />
              Flights
            </TabsTrigger>
            <TabsTrigger value="hotels" className="gap-2">
              <Hotel className="h-4 w-4" />
              Hotels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights" className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From</label>
                  <Input placeholder="Departure city..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To</label>
                  <Input placeholder="Arrival city..." />
                </div>
              </div>
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search Flights
              </Button>
            </Card>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Popular Flights</h2>
              {flights.map((flight) => (
                <Card key={flight.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{flight.airline}</span>
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-lg">
                          <span>{flight.from}</span>
                          <Plane className="h-4 w-4 text-primary" />
                          <span>{flight.to}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{flight.duration}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {flight.rating}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{flight.price} XP</span>
                    <Button onClick={() => handleBook('Flight', `${flight.from} to ${flight.to}`)}>
                      Book Flight
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hotels by location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-6xl">
                    {hotel.image}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{hotel.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {hotel.location}
                        </div>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {hotel.rating}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hotel.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">{hotel.price} XP/night</span>
                      <Button size="sm" onClick={() => handleBook('Hotel', hotel.name)}>
                        Book
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Travel;
