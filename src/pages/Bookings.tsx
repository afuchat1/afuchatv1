import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, ArrowLeft, Search, MapPin, Clock, Star, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

const services = [
  { id: 1, name: 'Hair Salon', category: 'Beauty', rating: 4.9, price: '50', image: '💇', slots: 8 },
  { id: 2, name: 'Spa & Massage', category: 'Wellness', rating: 4.8, price: '80', image: '💆', slots: 5 },
  { id: 3, name: 'Fitness Training', category: 'Fitness', rating: 4.7, price: '45', image: '💪', slots: 12 },
  { id: 4, name: 'Dental Clinic', category: 'Healthcare', rating: 4.9, price: '100', image: '🦷', slots: 6 },
  { id: 5, name: 'Car Wash', category: 'Auto', rating: 4.6, price: '30', image: '🚗', slots: 15 },
  { id: 6, name: 'Pet Grooming', category: 'Pets', rating: 4.8, price: '40', image: '🐕', slots: 10 },
];

const Bookings = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'Beauty', 'Wellness', 'Fitness', 'Healthcare', 'Auto', 'Pets'];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBook = (serviceName: string) => {
    toast.success(`Booking ${serviceName}...`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hidden lg:inline-flex">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Bookings & Reservations</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
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
                  className="shrink-0 capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="p-4 cursor-pointer hover:shadow-lg transition-all">
                  <div className="flex gap-4">
                    <div className="text-5xl">{service.image}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.category}</p>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {service.rating}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-primary">{service.price} XP</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {service.slots} slots
                        </div>
                      </div>
                      <Button className="w-full" size="sm" onClick={() => handleBook(service.name)}>
                        Book Now
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right: Calendar & Info */}
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Select Date</h3>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Popular Times</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Morning (9-12)</span>
                  <Badge variant="secondary">Busy</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Afternoon (12-5)</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Evening (5-9)</span>
                  <Badge variant="destructive">Full</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Bookings;
