import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, MapPin, Users, Star, Clock, Heart, Share2, Ticket } from 'lucide-react';
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
    description: 'Three days of non-stop music featuring top artists from around the world. Experience the best summer festival with amazing performances, food trucks, and unforgettable memories.',
    venue: 'Central Park Main Stage',
    address: '123 Park Avenue, New York, NY 10001',
    schedule: [
      { day: 'Day 1', time: '18:00 - 23:00', artist: 'Headliner Artist' },
      { day: 'Day 2', time: '16:00 - 23:00', artist: 'Multiple Artists' },
      { day: 'Day 3', time: '15:00 - 22:00', artist: 'Grand Finale' }
    ],
    amenities: ['Food & Drinks', 'Parking', 'Merchandise', 'VIP Area']
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
    description: 'Latest innovations and networking opportunities with industry leaders. Learn about cutting-edge technologies and connect with professionals.',
    venue: 'Grand Convention Hall',
    address: '456 Tech Street, San Francisco, CA 94102',
    schedule: [
      { day: 'Day 1', time: '09:00 - 18:00', artist: 'Keynote & Workshops' },
      { day: 'Day 2', time: '09:00 - 18:00', artist: 'Tech Talks & Demos' },
      { day: 'Day 3', time: '09:00 - 16:00', artist: 'Networking Event' }
    ],
    amenities: ['WiFi', 'Catering', 'Parking', 'Networking Lounge']
  },
];

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <Button onClick={() => navigate('/events')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const handleBookTicket = () => {
    toast.success('Ticket booking coming soon!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Image */}
      <div className="relative h-64 md:h-96">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => navigate('/events')}
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
          <Badge className="bg-primary">{event.category}</Badge>
        </div>
      </div>

      {/* Event Info */}
      <div className="container max-w-4xl mx-auto px-4 -mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                <p className="text-muted-foreground mb-4">{event.description}</p>
              </div>
              <Badge variant="secondary" className="gap-1 ml-4">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {event.rating}
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">{event.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{event.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Attendees</p>
                  <p className="font-semibold">{event.attendees} attending</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-semibold text-primary text-lg">{event.price} Nexa</p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Venue</h3>
              <p className="text-muted-foreground">{event.venue}</p>
              <p className="text-sm text-muted-foreground">{event.address}</p>
            </div>

            <Button size="lg" className="w-full gap-2" onClick={handleBookTicket}>
              <Ticket className="h-5 w-5" />
              Book Tickets - {event.price} Nexa
            </Button>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Event Schedule</h2>
            <div className="space-y-4">
              {event.schedule.map((item, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.day}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </div>
                    <p className="text-sm mt-1">{item.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {event.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventDetail;
