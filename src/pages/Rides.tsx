import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, MapPin, Star, Car, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

const rideOptions = [
  { id: 'economy', name: 'Economy', description: '4 passengers', price: '50', icon: '🚗', time: '3 min' },
  { id: 'comfort', name: 'Comfort', description: '4 passengers, premium', price: '75', icon: '🚙', time: '5 min' },
  { id: 'xl', name: 'XL', description: '6 passengers', price: '100', icon: '🚐', time: '6 min' },
  { id: 'premium', name: 'Premium', description: 'Luxury ride', price: '150', icon: '🏎️', time: '8 min' },
];

const Rides = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRide, setSelectedRide] = useState('economy');

  const handleBookRide = () => {
    if (!pickup || !destination) {
      toast.error('Please enter pickup and destination');
      return;
    }
    const ride = rideOptions.find(r => r.id === selectedRide);
    toast.success(`Booking ${ride?.name} ride...`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hidden lg:inline-flex">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-4 text-lg font-semibold">Book a Ride</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Map Placeholder & Form */}
          <div className="space-y-6">
            <Card className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Map View</p>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Pickup Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Enter pickup location..."
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                  <Input
                    placeholder="Where to?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Ride Options */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Choose a ride</h2>
            
            {rideOptions.map((ride) => (
              <Card
                key={ride.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedRide === ride.id
                    ? 'border-primary border-2 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedRide(ride.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{ride.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{ride.name}</h3>
                      <span className="text-lg font-bold">{ride.price} XP</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {ride.description}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ride.time} away
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Button className="w-full" size="lg" onClick={handleBookRide}>
              Book Ride
            </Button>

            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Payment with XP</h3>
              <p className="text-sm text-muted-foreground">
                All rides are paid using your XP balance. Make sure you have enough XP before booking.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Rides;
