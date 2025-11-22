import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

// Phone number validation schema - international format with country code
const phoneSchema = z.string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in international format (e.g., +1234567890)')
  .min(8, 'Phone number is too short')
  .max(16, 'Phone number is too long');

export const PhoneNumberInput = () => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPhoneNumber();
  }, [user]);

  const loadPhoneNumber = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const phone = data?.phone_number || '';
      setPhoneNumber(phone);
      setOriginalPhone(phone);
    } catch (error) {
      console.error('Error loading phone number:', error);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters except the leading +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2);
      } else if (cleaned.length > 0) {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
    setError('');
  };

  const validateAndSave = async () => {
    if (!user) return;

    // Validate phone number
    try {
      phoneSchema.parse(phoneNumber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone_number: phoneNumber })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setOriginalPhone(phoneNumber);
      setIsEditing(false);
      toast.success('Phone number updated successfully');
    } catch (error: any) {
      console.error('Error updating phone number:', error);
      if (error.message.includes('check_phone_number_format')) {
        setError('Invalid phone number format. Use international format: +1234567890');
      } else {
        toast.error('Failed to update phone number');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPhoneNumber(originalPhone);
    setIsEditing(false);
    setError('');
  };

  const handleRemove = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone_number: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setPhoneNumber('');
      setOriginalPhone('');
      setIsEditing(false);
      toast.success('Phone number removed');
    } catch (error) {
      console.error('Error removing phone number:', error);
      toast.error('Failed to remove phone number');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = phoneNumber !== originalPhone;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Phone className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Phone Number</h3>
      </div>

      <div className="space-y-4">
        {!isEditing ? (
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">
                    {originalPhone || 'Not configured'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {originalPhone ? 'Edit' : 'Add'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-muted-foreground text-xs">(International format)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={error ? 'border-red-500' : ''}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter your phone number with country code (e.g., +1 for US, +44 for UK, +91 for India)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={validateAndSave}
                disabled={isSaving || !hasChanges || !phoneNumber}
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              {originalPhone && (
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={isSaving}
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
