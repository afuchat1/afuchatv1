import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Eye, MessageCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CustomLoader } from '@/components/ui/CustomLoader';

interface OrderContext {
  order_number?: string;
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  total?: number;
  type?: 'new_order' | 'cancellation' | 'refund_request' | 'status_update';
}

interface OrderNotificationActionsProps {
  orderContext: OrderContext;
  isAdmin?: boolean;
}

const SHOPSHACK_ADMIN_NOTIFICATIONS_CHAT_ID = 'a0000000-0000-0000-0000-000000000001';

export function OrderNotificationActions({ orderContext, isAdmin }: OrderNotificationActionsProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleViewOrder = () => {
    if (orderContext.order_number) {
      navigate(`/order/${orderContext.order_number}`);
    }
  };

  const handleContactCustomer = async () => {
    if (!orderContext.customer_id) return;
    
    setLoading('contact');
    try {
      // Get merchant info for ShopShack
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', '629333cf-087e-4283-8a09-a44282dda98b')
        .single();

      if (!merchant) {
        toast.error('Merchant not found');
        return;
      }

      // Check for existing chat with this customer
      const { data: existingChat } = await supabase
        .from('merchant_customer_chats')
        .select('chat_id')
        .eq('merchant_id', merchant.id)
        .eq('customer_id', orderContext.customer_id)
        .maybeSingle();

      if (existingChat?.chat_id) {
        navigate(`/chat/${existingChat.chat_id}`);
      } else {
        // Create new chat
        const { data: newChat, error } = await supabase
          .from('chats')
          .insert({
            created_by: '629333cf-087e-4283-8a09-a44282dda98b',
            is_group: false
          })
          .select('id')
          .single();

        if (error) throw error;

        // Add members
        await supabase.from('chat_members').insert([
          { chat_id: newChat.id, user_id: '629333cf-087e-4283-8a09-a44282dda98b' },
          { chat_id: newChat.id, user_id: orderContext.customer_id }
        ]);

        // Track relationship
        await supabase.from('merchant_customer_chats').insert({
          merchant_id: merchant.id,
          customer_id: orderContext.customer_id,
          chat_id: newChat.id
        });

        navigate(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Error contacting customer:', error);
      toast.error('Failed to open chat');
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!orderContext.order_number) return;
    
    setLoading(newStatus);
    try {
      const { error } = await supabase
        .from('merchant_orders')
        .update({ status: newStatus })
        .eq('order_number', orderContext.order_number);

      if (error) throw error;

      // Send status update notification
      await supabase.from('messages').insert({
        chat_id: SHOPSHACK_ADMIN_NOTIFICATIONS_CHAT_ID,
        sender_id: '629333cf-087e-4283-8a09-a44282dda98b',
        encrypted_content: `✅ Order ${orderContext.order_number} status updated to: ${newStatus}`,
        order_context: {
          ...orderContext,
          type: 'status_update',
          new_status: newStatus
        }
      });

      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setLoading(null);
    }
  };

  if (!isAdmin) {
    // Customer view - just show view order button
    return (
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline" onClick={handleViewOrder}>
          <Eye className="h-3 w-3 mr-1" />
          View Order
        </Button>
      </div>
    );
  }

  // Admin/Merchant view
  return (
    <div className="space-y-2 mt-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleViewOrder}>
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleContactCustomer}
          disabled={loading === 'contact'}
        >
          {loading === 'contact' ? (
            <CustomLoader size="sm" />
          ) : (
            <>
              <MessageCircle className="h-3 w-3 mr-1" />
              Chat
            </>
          )}
        </Button>
      </div>
      
      {orderContext.type === 'new_order' && (
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleUpdateStatus('payment_recorded')}
            disabled={loading === 'payment_recorded'}
          >
            {loading === 'payment_recorded' ? (
              <CustomLoader size="sm" />
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirm Payment
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => handleUpdateStatus('cancelled')}
            disabled={loading === 'cancelled'}
          >
            {loading === 'cancelled' ? (
              <CustomLoader size="sm" />
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Cancel
              </>
            )}
          </Button>
        </div>
      )}

      {orderContext.type === 'refund_request' && (
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleUpdateStatus('refunded')}
            disabled={loading === 'refunded'}
          >
            {loading === 'refunded' ? (
              <CustomLoader size="sm" />
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Approve Refund
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleUpdateStatus('refund_rejected')}
            disabled={loading === 'refund_rejected'}
          >
            Reject Refund
          </Button>
        </div>
      )}
    </div>
  );
}