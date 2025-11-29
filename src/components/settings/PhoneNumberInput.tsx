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
  const [countryCode, setCountryCode] = useState('');

  useEffect(() => {
    loadPhoneNumber();
  }, [user]);

  const loadPhoneNumber = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone_number, country')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const phone = data?.phone_number || '';
      const userCountry = data?.country || '';
      
      // Get country code based on user's country
      const code = getCountryCode(userCountry);
      setCountryCode(code);
      
      // Extract phone number without country code if it exists
      const phoneWithoutCode = phone.startsWith(code) ? phone.substring(code.length) : phone;
      setPhoneNumber(phoneWithoutCode);
      setOriginalPhone(phoneWithoutCode);
    } catch (error) {
      console.error('Error loading phone number:', error);
    }
  };

  const getCountryCode = (country: string): string => {
    const countryCodes: Record<string, string> = {
      'United States': '+1',
      'Canada': '+1',
      'United Kingdom': '+44',
      'India': '+91',
      'China': '+86',
      'Japan': '+81',
      'Germany': '+49',
      'France': '+33',
      'Brazil': '+55',
      'Australia': '+61',
      'South Africa': '+27',
      'Nigeria': '+234',
      'Kenya': '+254',
      'Egypt': '+20',
      'Mexico': '+52',
      'Spain': '+34',
      'Italy': '+39',
      'Russia': '+7',
      'South Korea': '+82',
      'Indonesia': '+62',
      'Thailand': '+66',
      'Vietnam': '+84',
      'Philippines': '+63',
      'Turkey': '+90',
      'Saudi Arabia': '+966',
      'UAE': '+971',
      'Argentina': '+54',
      'Colombia': '+57',
      'Chile': '+56',
      'Peru': '+51',
    };
    return countryCodes[country] || '+1';
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits and limit length
    const cleaned = value.replace(/\D/g, '');
    setPhoneNumber(cleaned);
    setError('');
  };

  const validateAndSave = async () => {
    if (!user) return;

    const fullPhoneNumber = countryCode + phoneNumber;

    // Validate phone number
    try {
      phoneSchema.parse(fullPhoneNumber);
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
        .update({ phone_number: fullPhoneNumber })
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
                  {originalPhone ? `${countryCode}${originalPhone}` : 'Not configured'}
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
                Phone Number
              </Label>
              <div className="flex gap-2">
                <div className="w-20 flex items-center justify-center bg-muted rounded-md px-3 text-sm font-medium">
                  {countryCode}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1234567890"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={error ? 'border-red-500' : ''}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Country code is set based on your profile country. Enter only your phone number.
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
