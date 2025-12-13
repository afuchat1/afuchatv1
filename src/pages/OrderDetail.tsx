import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, CheckCircle, Clock, XCircle, Truck, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { CustomLoader } from '@/components/ui/CustomLoader';

const SHOPSHACH_USER_ID = '629333cf-087e-4283-8a09-a44282dda98b';
interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  merchant: {
    name: string;
  };
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending_payment: { 
    label: 'Pending Payment', 
    icon: <Clock className="h-4 w-4" />, 
    color: 'bg-yellow-500/10 text-yellow-500' 
  },
  payment_recorded: { 
    label: 'Payment Recorded', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'bg-blue-500/10 text-blue-500' 
  },
  fulfilled: { 
    label: 'Fulfilled', 
    icon: <Truck className="h-4 w-4" />, 
    color: 'bg-purple-500/10 text-purple-500' 
  },
  completed: { 
    label: 'Completed', 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'bg-green-500/10 text-green-500' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: <XCircle className="h-4 w-4" />, 
    color: 'bg-destructive/10 text-destructive' 
  },
};

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactingSupport, setContactingSupport] = useState(false);

  useEffect(() => {
    if (user && orderNumber) {
      fetchOrder();
    }
  }, [user, orderNumber]);

  const fetchOrder = async () => {
    try {
      const { data: orderData } = await supabase
        .from('merchant_orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          payment_status,
          created_at,
          merchant:merchants(name)
        `)
        .eq('order_number', orderNumber)
        .single();

      if (orderData) {
        setOrder(orderData as unknown as Order);

        const { data: itemsData } = await supabase
          .from('merchant_order_items')
          .select('id, product_name, product_price, quantity, subtotal')
          .eq('order_id', orderData.id);

        if (itemsData) {
          setItems(itemsData);
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = async () => {
    if (!user) {
      toast.error('Please sign in to contact support');
      return;
    }

    setContactingSupport(true);
    try {
      // Find a 1-on-1 chat between user and ShopShach
      const { data: userChats } = await supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', user.id);

      const { data: shopshachChats } = await supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', SHOPSHACH_USER_ID);

      const userChatIds = userChats?.map(c => c.chat_id) || [];
      const shopshachChatIds = shopshachChats?.map(c => c.chat_id) || [];
      const commonChatIds = userChatIds.filter(id => shopshachChatIds.includes(id));

      let chatId: string | null = null;

      // Check if any common chat is a 1-on-1 (not group)
      if (commonChatIds.length > 0) {
        const { data: chat } = await supabase
          .from('chats')
          .select('id')
          .in('id', commonChatIds)
          .eq('is_group', false)
          .maybeSingle();

        if (chat) {
          chatId = chat.id;
        }
      }

      // Create new chat if doesn't exist
      if (!chatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({
            created_by: user.id,
            is_group: false
          })
          .select('id')
          .single();

        if (chatError) throw chatError;
        chatId = newChat.id;

        // Add both members
        await supabase.from('chat_members').insert([
          { chat_id: chatId, user_id: user.id },
          { chat_id: chatId, user_id: SHOPSHACH_USER_ID }
        ]);

        // Send initial order inquiry message
        await supabase.from('messages').insert({
          chat_id: chatId,
          sender_id: user.id,
          encrypted_content: `Hi! I have an inquiry about my order ${order?.order_number}. Total: UGX ${order?.total_amount.toLocaleString()}`
        });
      }

      navigate(`/chats/${chatId}`);
    } catch (error) {
      console.error('Error contacting support:', error);
      toast.error('Failed to start chat with support');
    } finally {
      setContactingSupport(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <CustomLoader size="lg" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <Button onClick={() => navigate('/orders')}>View All Orders</Button>
        </div>
      </Layout>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending_payment;

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">Order Details</h1>
              <p className="text-xs text-muted-foreground">{order.order_number}</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Status Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Badge className={status.color}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              
              <div className="text-center py-6">
                <Package className="h-12 w-12 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold">UGX {order.total_amount.toLocaleString()}</h2>
                <p className="text-muted-foreground">{order.merchant.name}</p>
              </div>

              {order.status === 'pending_payment' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                  <h3 className="font-medium text-yellow-600 mb-2">Payment Instructions</h3>
                  <p className="text-sm text-muted-foreground">
                    Please pay directly to {order.merchant.name}. Your order will be processed 
                    once payment is confirmed by the merchant.
                  </p>
                </div>
              )}

              {/* Contact Seller Button */}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleContactSupport}
                disabled={contactingSupport}
              >
                {contactingSupport ? (
                  <CustomLoader size="sm" />
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact {order.merchant.name}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      UGX {item.product_price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-sm">
                    UGX {item.subtotal.toLocaleString()}
                  </p>
                </div>
              ))}
              
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>UGX {order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}