import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Clock, Star, MapPin, Phone, Heart, Share2, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

const services = [
  { 
    id: '1', 
    name: 'Hair Salon', 
    category: 'Beauty', 
    rating: 4.9, 
    price: '50', 
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop', 
    duration: '45 min',
    description: 'Professional hair styling and treatment with experienced stylists. We offer cuts, coloring, styling, and treatments.',
    address: '789 Beauty Avenue, City Center',
    phone: '+1 234 567 8902',
    services: [
      { name: 'Haircut', price: '50', duration: '45 min' },
      { name: 'Hair Coloring', price: '120', duration: '2 hours' },
      { name: 'Hair Treatment', price: '80', duration: '1 hour' },
      { name: 'Styling', price: '40', duration: '30 min' }
    ],
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
  },
  { 
    id: '2', 
    name: 'Spa & Massage', 
    category: 'Wellness', 
    rating: 4.8, 
    price: '80', 
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', 
    duration: '60 min',
    description: 'Relaxing spa treatments and massages in a tranquil environment. Expert therapists provide personalized care.',
    address: '321 Wellness Street, Spa District',
    phone: '+1 234 567 8903',
    services: [
      { name: 'Swedish Massage', price: '80', duration: '60 min' },
      { name: 'Deep Tissue', price: '100', duration: '60 min' },
      { name: 'Facial Treatment', price: '90', duration: '75 min' },
      { name: 'Full Body Spa', price: '150', duration: '90 min' }
    ],
    availableSlots: ['10:00', '12:00', '14:00', '16:00', '18:00']
  },
];

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const service = services.find(s => s.id === id);

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Service Not Found</h2>
          <Button onClick={() => navigate('/bookings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  const handleBooking = () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    toast.success(`Booking confirmed for ${selectedSlot}!`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Image */}
      <div className="relative h-64 md:h-96">
        <img 
          src={service.image} 
          alt={service.name}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => navigate('/bookings')}
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
        <div className="absolute bottom-4 left-4">
          <Badge className="bg-primary">{service.category}</Badge>
        </div>
      </div>

      {/* Service Info */}
      <div className="container max-w-4xl mx-auto px-4 -mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
                <p className="text-muted-foreground mb-2">{service.description}</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {service.rating}
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{service.duration} average</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{service.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{service.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Offered */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Services Offered</h2>
            <div className="space-y-3">
              {service.services.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {item.duration}
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary">{item.price} Nexa</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Calendar */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Available Time Slots</h3>
              <div className="grid grid-cols-2 gap-2">
                {service.availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedSlot === slot ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>

              <Separator className="my-4" />

              <Button 
                size="lg" 
                className="w-full gap-2" 
                onClick={handleBooking}
                disabled={!selectedSlot}
              >
                <CalendarCheck className="h-5 w-5" />
                Book Appointment - {service.price} Nexa
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
