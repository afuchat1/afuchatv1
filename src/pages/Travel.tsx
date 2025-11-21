import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plane, Hotel, Calendar, MapPin, Star, Users, ArrowRight, Wifi, Coffee, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

const flights = [
  { id: 1, from: 'NYC', to: 'LAX', fromFull: 'New York', toFull: 'Los Angeles', price: '500', duration: '6h', airline: 'SkyLine', rating: 4.8, stops: 'Direct', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop' },
  { id: 2, from: 'LON', to: 'PAR', fromFull: 'London', toFull: 'Paris', price: '200', duration: '1h 30m', airline: 'EuroJet', rating: 4.7, stops: 'Direct', image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=600&h=400&fit=crop' },
  { id: 3, from: 'TOK', to: 'SYD', fromFull: 'Tokyo', toFull: 'Sydney', price: '800', duration: '9h', airline: 'Pacific Air', rating: 4.9, stops: 'Direct', image: 'https://images.unsplash.com/photo-1525624286412-4099c83c1bc8?w=600&h=400&fit=crop' },
  { id: 4, from: 'DXB', to: 'NYC', fromFull: 'Dubai', toFull: 'New York', price: '950', duration: '14h', airline: 'Emirates', rating: 4.9, stops: 'Direct', image: 'https://images.unsplash.com/photo-1583938443000-d87479eda0b8?w=600&h=400&fit=crop' },
];

const hotels = [
  { 
    id: 1, 
    name: 'Grand Plaza Hotel', 
    location: 'New York', 
    price: '300', 
    rating: 4.8, 
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop', 
    amenities: [{ name: 'WiFi', icon: Wifi }, { name: 'Pool', icon: Coffee }, { name: 'Restaurant', icon: UtensilsCrossed }],
    rooms: 'Deluxe Room',
    featured: true
  },
  { 
    id: 2, 
    name: 'Beach Resort', 
    location: 'Miami', 
    price: '250', 
    rating: 4.7, 
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop', 
    amenities: [{ name: 'Beach', icon: Coffee }, { name: 'Spa', icon: Coffee }, { name: 'Restaurant', icon: UtensilsCrossed }],
    rooms: 'Ocean View',
    featured: true
  },
  { 
    id: 3, 
    name: 'Mountain Lodge', 
    location: 'Denver', 
    price: '200', 
    rating: 4.6, 
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop', 
    amenities: [{ name: 'Hiking', icon: Coffee }, { name: 'Fireplace', icon: Coffee }, { name: 'View', icon: Coffee }],
    rooms: 'Suite',
    featured: false
  },
  { 
    id: 4, 
    name: 'City Center Inn', 
    location: 'Chicago', 
    price: '180', 
    rating: 4.5, 
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop', 
    amenities: [{ name: 'WiFi', icon: Wifi }, { name: 'Gym', icon: Coffee }, { name: 'Parking', icon: Coffee }],
    rooms: 'Standard Room',
    featured: false
  },
];

const Travel = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  const handleBook = (type: string, name: string) => {
    toast.success(`Booking ${type}: ${name}...`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-background border-b">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Plane className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold">Travel & Hotels</h1>
          </div>
          <p className="text-muted-foreground text-lg">Book flights and hotels for your next adventure</p>
        </div>
      </div>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="flights" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger value="flights" className="gap-2 text-base">
              <Plane className="h-5 w-5" />
              Flights
            </TabsTrigger>
            <TabsTrigger value="hotels" className="gap-2 text-base">
              <Hotel className="h-5 w-5" />
              Hotels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights" className="space-y-6">
            {/* Search Card */}
            <Card className="p-6 border-2 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Search Flights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From</label>
                  <Input 
                    placeholder="Departure city..." 
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To</label>
                  <Input 
                    placeholder="Arrival city..." 
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <Button className="w-full h-11" size="lg">
                <Search className="h-5 w-5 mr-2" />
                Search Flights
              </Button>
            </Card>

            {/* Flights List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Available Flights</h2>
              {flights.map((flight) => (
                <Card key={flight.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                    {/* Flight Image */}
                    <div className="md:col-span-2 aspect-video md:aspect-auto relative overflow-hidden">
                      <img 
                        src={flight.image} 
                        alt={`Flight from ${flight.fromFull} to ${flight.toFull}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-background/90 backdrop-blur-sm text-foreground border">
                          {flight.airline}
                        </Badge>
                      </div>
                    </div>

                    {/* Flight Details */}
                    <CardContent className="md:col-span-3 p-4 md:p-6 flex flex-col justify-center">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{flight.from}</div>
                              <div className="text-xs text-muted-foreground">{flight.fromFull}</div>
                            </div>
                            <div className="flex-1 flex items-center justify-center min-w-0">
                              <div className="border-t-2 border-dashed flex-1" />
                              <Plane className="h-5 w-5 text-primary mx-2 flex-shrink-0" />
                              <div className="border-t-2 border-dashed flex-1" />
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{flight.to}</div>
                              <div className="text-xs text-muted-foreground">{flight.toFull}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span>{flight.duration}</span>
                            <span>•</span>
                            <span>{flight.stops}</span>
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {flight.rating}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{flight.price} XP</div>
                            <div className="text-xs text-muted-foreground">per person</div>
                          </div>
                          <Button onClick={() => handleBook('Flight', `${flight.fromFull} to ${flight.toFull}`)} className="gap-2">
                            Book Now
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search hotels by location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Featured Hotels */}
            <section>
              <h2 className="text-xl font-bold mb-4">Featured Hotels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotels.filter(h => h.featured).map((hotel) => (
                  <Card key={hotel.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{hotel.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            {hotel.location}
                          </div>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {hotel.rating}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{hotel.rooms}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs gap-1">
                            <amenity.icon className="h-3 w-3" />
                            {amenity.name}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <div className="text-xl font-bold text-primary">{hotel.price} XP</div>
                          <div className="text-xs text-muted-foreground">per night</div>
                        </div>
                        <Button size="sm" onClick={() => handleBook('Hotel', hotel.name)}>
                          Book
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* All Hotels */}
            <section>
              <h2 className="text-xl font-bold mb-4">All Hotels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotels.filter(h => !h.featured).map((hotel) => (
                  <Card key={hotel.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
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
                        {hotel.amenities.map((amenity, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {amenity.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{hotel.price} XP/night</span>
                        <Button size="sm" variant="outline" onClick={() => handleBook('Hotel', hotel.name)}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Travel;
