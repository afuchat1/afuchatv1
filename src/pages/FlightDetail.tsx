import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plane, Clock, Star, Users, Wifi, Coffee, Luggage, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const flights = [
  { 
    id: '1', 
    from: 'NYC', 
    to: 'LAX', 
    fromFull: 'New York (JFK)', 
    toFull: 'Los Angeles (LAX)', 
    price: '500', 
    duration: '6h', 
    airline: 'SkyLine', 
    rating: 4.8, 
    stops: 'Direct', 
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop',
    departureTime: '10:30 AM',
    arrivalTime: '01:30 PM (PST)',
    flightNumber: 'SL 4521',
    aircraft: 'Boeing 737-800',
    amenities: ['WiFi', 'In-flight Entertainment', 'Meals Included', 'Extra Legroom'],
    baggage: '1 carry-on + 1 checked bag',
    class: 'Economy',
    seats: '42 seats remaining'
  },
  { 
    id: '2', 
    from: 'LON', 
    to: 'PAR', 
    fromFull: 'London (LHR)', 
    toFull: 'Paris (CDG)', 
    price: '200', 
    duration: '1h 30m', 
    airline: 'EuroJet', 
    rating: 4.7, 
    stops: 'Direct', 
    image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=600&h=400&fit=crop',
    departureTime: '08:45 AM',
    arrivalTime: '11:15 AM (CET)',
    flightNumber: 'EJ 2103',
    aircraft: 'Airbus A320',
    amenities: ['WiFi', 'Snacks', 'Priority Boarding'],
    baggage: '1 carry-on',
    class: 'Economy',
    seats: '28 seats remaining'
  },
];

const FlightDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const flight = flights.find(f => f.id === id);

  if (!flight) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Flight Not Found</h2>
          <Button onClick={() => navigate('/travel')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Flights
          </Button>
        </div>
      </div>
    );
  }

  const handleBookFlight = () => {
    toast.success('Flight booking coming soon!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Image */}
      <div className="relative h-64 md:h-96">
        <img 
          src={flight.image} 
          alt={`Flight from ${flight.fromFull} to ${flight.toFull}`}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => navigate('/travel')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Flight Info */}
      <div className="container max-w-4xl mx-auto px-4 -mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* Airline & Rating */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{flight.airline}</p>
                  <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {flight.rating}
              </Badge>
            </div>

            <Separator className="my-4" />

            {/* Route */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{flight.from}</p>
                  <p className="text-sm text-muted-foreground">{flight.fromFull}</p>
                  <p className="text-lg font-semibold mt-2">{flight.departureTime}</p>
                </div>
                <div className="flex-1 flex flex-col items-center px-4">
                  <div className="flex items-center w-full">
                    <div className="border-t-2 border-dashed flex-1" />
                    <Plane className="h-6 w-6 text-primary mx-2" />
                    <div className="border-t-2 border-dashed flex-1" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{flight.duration}</p>
                  <Badge variant="outline" className="mt-1">{flight.stops}</Badge>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{flight.to}</p>
                  <p className="text-sm text-muted-foreground">{flight.toFull}</p>
                  <p className="text-lg font-semibold mt-2">{flight.arrivalTime}</p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Aircraft</p>
                <p className="font-semibold">{flight.aircraft}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-semibold">{flight.class}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Baggage</p>
                <p className="font-semibold">{flight.baggage}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Availability</p>
                <p className="font-semibold text-green-600">{flight.seats}</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Price & Book */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="text-3xl font-bold text-primary">{flight.price} Nexa</p>
                <p className="text-xs text-muted-foreground">per person</p>
              </div>
              <Button size="lg" onClick={handleBookFlight}>
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flight.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-lg border">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {index === 0 && <Wifi className="h-4 w-4 text-primary" />}
                    {index === 1 && <Coffee className="h-4 w-4 text-primary" />}
                    {index === 2 && <Coffee className="h-4 w-4 text-primary" />}
                    {index === 3 && <Luggage className="h-4 w-4 text-primary" />}
                  </div>
                  <span className="text-sm font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Flight Policy */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Booking Policy</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>Free cancellation up to 24 hours before departure</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>Changes permitted with a fee of 50 Nexa</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>Check-in opens 24 hours before departure</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <p>Boarding closes 30 minutes before departure</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlightDetail;
