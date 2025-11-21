import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Search, MapPin, Clock, Star, Utensils,
  Pizza, Coffee, IceCream, Sandwich, Fish, Salad
} from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { id: 'all', name: 'All', icon: Utensils },
  { id: 'pizza', name: 'Pizza', icon: Pizza },
  { id: 'coffee', name: 'Cafe', icon: Coffee },
  { id: 'dessert', name: 'Dessert', icon: IceCream },
  { id: 'fast', name: 'Fast Food', icon: Sandwich },
  { id: 'seafood', name: 'Seafood', icon: Fish },
  { id: 'healthy', name: 'Healthy', icon: Salad },
];

const restaurants = [
  { id: 1, name: 'Italian Delights', cuisine: 'Italian', rating: 4.8, deliveryTime: '25-35', image: '🍕', category: 'pizza', featured: true },
  { id: 2, name: 'Coffee House', cuisine: 'Cafe', rating: 4.7, deliveryTime: '15-20', image: '☕', category: 'coffee', featured: true },
  { id: 3, name: 'Sweet Treats', cuisine: 'Desserts', rating: 4.9, deliveryTime: '20-30', image: '🍰', category: 'dessert', featured: false },
  { id: 4, name: 'Burger Palace', cuisine: 'American', rating: 4.6, deliveryTime: '30-40', image: '🍔', category: 'fast', featured: true },
  { id: 5, name: 'Ocean Fresh', cuisine: 'Seafood', rating: 4.8, deliveryTime: '35-45', image: '🦞', category: 'seafood', featured: false },
  { id: 6, name: 'Green Bowl', cuisine: 'Healthy', rating: 4.7, deliveryTime: '20-25', image: '🥗', category: 'healthy', featured: false },
];

const FoodDelivery = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredRestaurants = restaurants.filter(rest => {
    const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rest.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || rest.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOrder = (restaurantName: string) => {
    toast.success(`Opening menu for ${restaurantName}...`);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search restaurants or cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0 gap-2"
            >
              <cat.icon className="h-4 w-4" />
              {cat.name}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="delivery" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="pickup">Pickup</TabsTrigger>
          </TabsList>

          <TabsContent value="delivery" className="space-y-6 mt-6">
            {/* Featured */}
            {filteredRestaurants.some(r => r.featured) && (
              <section>
                <h2 className="text-lg font-semibold mb-4">Featured</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRestaurants.filter(r => r.featured).map((restaurant) => (
                    <Card key={restaurant.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-6xl">
                        {restaurant.image}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{restaurant.name}</h3>
                            <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                          </div>
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            {restaurant.rating}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {restaurant.deliveryTime} min
                          </div>
                        </div>
                        <Button className="w-full" onClick={() => handleOrder(restaurant.name)}>
                          Order Now
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* All Restaurants */}
            <section>
              <h2 className="text-lg font-semibold mb-4">All Restaurants</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRestaurants.map((restaurant) => (
                  <Card key={restaurant.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-all">
                    <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-6xl">
                      {restaurant.image}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {restaurant.rating}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <Clock className="h-3 w-3" />
                        {restaurant.deliveryTime} min
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => handleOrder(restaurant.name)}>
                        View Menu
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="pickup" className="mt-6">
            <div className="text-center py-12">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Pickup feature coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FoodDelivery;
