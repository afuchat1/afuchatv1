import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Star, Clock, MapPin, Phone, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const restaurants = [
  { 
    id: '1', 
    name: 'Italian Delights', 
    cuisine: 'Italian', 
    rating: 4.8, 
    deliveryTime: '25-35', 
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop', 
    category: 'pizza', 
    minOrder: '50',
    deliveryFee: '10',
    address: '123 Main Street, Downtown',
    phone: '+1 234 567 8900',
    description: 'Authentic Italian cuisine with handmade pasta and wood-fired pizzas. Family recipes passed down through generations.',
    menu: [
      { id: '1', name: 'Margherita Pizza', price: '80', description: 'Fresh mozzarella, tomato sauce, basil', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop' },
      { id: '2', name: 'Carbonara', price: '95', description: 'Egg, pecorino cheese, guanciale', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&h=200&fit=crop' },
      { id: '3', name: 'Tiramisu', price: '45', description: 'Classic Italian dessert with mascarpone', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop' },
      { id: '4', name: 'Lasagna', price: '105', description: 'Layered pasta with meat sauce and cheese', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&h=200&fit=crop' },
    ]
  },
  { 
    id: '2', 
    name: 'Coffee House', 
    cuisine: 'Cafe', 
    rating: 4.7, 
    deliveryTime: '15-20', 
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop', 
    category: 'coffee',
    minOrder: '20',
    deliveryFee: '5',
    address: '456 Coffee Lane, City Center',
    phone: '+1 234 567 8901',
    description: 'Premium coffee and fresh pastries. Sourced from the finest coffee beans worldwide.',
    menu: [
      { id: '1', name: 'Cappuccino', price: '35', description: 'Espresso with steamed milk foam', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop' },
      { id: '2', name: 'Croissant', price: '25', description: 'Buttery French pastry', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=200&fit=crop' },
      { id: '3', name: 'Latte', price: '40', description: 'Espresso with steamed milk', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop' },
      { id: '4', name: 'Muffin', price: '30', description: 'Fresh baked blueberry muffin', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&h=200&fit=crop' },
    ]
  },
];

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Record<string, number>>({});

  const restaurant = restaurants.find(r => r.id === id);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Restaurant Not Found</h2>
          <Button onClick={() => navigate('/food-delivery')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Restaurants
          </Button>
        </div>
      </div>
    );
  }

  const addToCart = (itemId: string) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    toast.success('Added to cart');
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = restaurant.menu.reduce((total, item) => {
    return total + (cart[item.id] || 0) * parseInt(item.price);
  }, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Image */}
      <div className="relative h-64 md:h-96">
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => navigate('/food-delivery')}
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

      {/* Restaurant Info */}
      <div className="container max-w-4xl mx-auto px-4 -mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                <p className="text-muted-foreground mb-2">{restaurant.cuisine}</p>
                <p className="text-sm text-muted-foreground">{restaurant.description}</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {restaurant.rating}
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{restaurant.deliveryTime} min</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{restaurant.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{restaurant.phone}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Minimum Order: {restaurant.minOrder} Nexa</span>
              {restaurant.deliveryFee === '0' ? (
                <Badge className="bg-green-600">Free Delivery</Badge>
              ) : (
                <span className="text-muted-foreground">Delivery: {restaurant.deliveryFee} Nexa</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Menu */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Menu</h2>
          <div className="grid grid-cols-1 gap-4">
            {restaurant.menu.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-32 h-32 object-cover"
                    />
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <p className="text-lg font-bold text-primary">{item.price} Nexa</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {cart[item.id] ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                            >
                              -
                            </Button>
                            <span className="font-semibold w-8 text-center">{cart[item.id]}</span>
                            <Button
                              size="sm"
                              onClick={() => addToCart(item.id)}
                            >
                              +
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(item.id)}>
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cart Summary */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50">
          <div className="container max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-semibold">{totalItems} items</p>
              <p className="text-lg font-bold text-primary">{totalPrice + parseInt(restaurant.deliveryFee)} Nexa</p>
            </div>
            <Button size="lg" onClick={() => toast.success('Checkout coming soon!')}>
              Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
