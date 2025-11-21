import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Hotel, MapPin, Star, Wifi, Coffee, UtensilsCrossed, Waves, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const hotels = [
  { 
    id: '1', 
    name: 'Grand Plaza Hotel', 
    location: 'New York', 
    price: '300', 
    rating: 4.8, 
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop', 
    rooms: 'Deluxe Room',
    address: '123 Fifth Avenue, New York, NY 10001',
    phone: '+1 234 567 8904',
    description: 'Luxury hotel in the heart of Manhattan with stunning city views and world-class amenities. Perfect for business and leisure travelers.',
    amenities: [
      { name: 'Free WiFi', icon: Wifi },
      { name: 'Swimming Pool', icon: Waves },
      { name: 'Restaurant', icon: UtensilsCrossed },
      { name: 'Room Service', icon: Coffee },
      { name: 'Fitness Center', icon: Coffee },
      { name: 'Spa', icon: Coffee }
    ],
    roomTypes: [
      { name: 'Standard Room', price: '250', beds: '1 Queen Bed', guests: '2' },
      { name: 'Deluxe Room', price: '300', beds: '1 King Bed', guests: '2' },
      { name: 'Suite', price: '450', beds: '1 King + Sofa Bed', guests: '4' },
      { name: 'Executive Suite', price: '600', beds: '2 King Beds', guests: '4' }
    ],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&h=400&fit=crop'
    ]
  },
];

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date());
  const [checkOut, setCheckOut] = useState<Date | undefined>(new Date(Date.now() + 86400000));
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  const hotel = hotels.find(h => h.id === id);

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Hotel Not Found</h2>
          <Button onClick={() => navigate('/travel')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hotels
          </Button>
        </div>
      </div>
    );
  }

  const handleBooking = () => {
    if (!selectedRoom) {
      toast.error('Please select a room type');
      return;
    }
    toast.success('Hotel booking coming soon!');
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const selectedRoomData = hotel.roomTypes.find(r => r.name === selectedRoom);
  const totalPrice = selectedRoomData ? parseInt(selectedRoomData.price) * calculateNights() : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Image Gallery */}
      <div className="relative h-64 md:h-96">
        <div className="grid grid-cols-3 gap-1 h-full">
          <img 
            src={hotel.images[0]} 
            alt={hotel.name}
            className="col-span-2 w-full h-full object-cover"
          />
          <div className="grid grid-rows-2 gap-1">
            <img src={hotel.images[1]} alt="Hotel" className="w-full h-full object-cover" />
            <img src={hotel.images[2]} alt="Hotel" className="w-full h-full object-cover" />
          </div>
        </div>
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

      {/* Hotel Info */}
      <div className="container max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Hotel Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{hotel.location}</span>
                    </div>
                    <p className="text-sm">{hotel.address}</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {hotel.rating}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <p className="text-muted-foreground">{hotel.description}</p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <amenity.icon className="h-5 w-5 text-primary" />
                      <span>{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Room Types */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Available Rooms</h2>
                <div className="space-y-3">
                  {hotel.roomTypes.map((room) => (
                    <div 
                      key={room.name} 
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedRoom === room.name ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedRoom(room.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-lg mb-1">{room.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{room.beds}</span>
                            <span>•</span>
                            <span>Up to {room.guests} guests</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{room.price} Nexa</p>
                          <p className="text-xs text-muted-foreground">per night</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Book Your Stay</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Check-in</p>
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      className="rounded-md border"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Check-out</p>
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      className="rounded-md border"
                    />
                  </div>

                  {selectedRoom && (
                    <>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Room</span>
                          <span className="font-medium">{selectedRoom}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{calculateNights()} nights</span>
                          <span className="font-medium">{selectedRoomData?.price} Nexa/night</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">{totalPrice} Nexa</span>
                        </div>
                      </div>
                    </>
                  )}

                  <Button 
                    size="lg" 
                    className="w-full" 
                    onClick={handleBooking}
                    disabled={!selectedRoom}
                  >
                    Book Now
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Free cancellation up to 48 hours before check-in
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;
