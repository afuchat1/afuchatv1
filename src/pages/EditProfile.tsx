import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; 
import { Loader2, User, Lock, Eye, MessageCircle, MapPin, Globe } from 'lucide-react'; 

// Import Supabase types (assuming types/supabase.ts exists)
import type { Database } from '@/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface EditProfileForm {
  display_name: string;
  handle: string;
  bio: string;
  is_private: boolean;
  show_online_status: boolean;
  show_read_receipts: boolean;
}

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const [profile, setProfile] = useState<EditProfileForm>({
    display_name: '',
    handle: '',
    bio: '',
    is_private: false,
    show_online_status: true,
    show_read_receipts: true,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasProfileRow, setHasProfileRow] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.id) {
        setLoading(false);
        toast.error("User ID not found for fetching profile.");
        return;
    }

    // Verify route matches current user
    if (userId && userId !== user.id) {
      toast.error('Access denied: Can only edit your own profile');
      navigate(`/${user.id}`);
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: ProfileRow | null; error: any };

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows"

        if (data) {
          setHasProfileRow(true);
          setProfile({
            display_name: data.display_name,
            handle: data.handle,
            bio: data.bio || '',
            is_private: data.is_private || false,
            show_online_status: data.show_online_status || true,
            show_read_receipts: data.show_read_receipts || true,
          });
        } else {
          // No existing row: Initialize defaults
          setHasProfileRow(false);
          setProfile({
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            handle: user.user_metadata?.user_name || user.email?.split('@')[0]?.toLowerCase() || '',
            bio: '',
            is_private: false,
            show_online_status: true,
            show_read_receipts: true,
          });
          toast.info('No existing profile found. Creating a new one on save.');
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate, userId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'handle') {
      const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: sanitizedValue }));
      return;
    }
    setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: value }));
  };

  const handleToggleChange = (key: keyof Pick<EditProfileForm, 'is_private' | 'show_online_status' | 'show_read_receipts'>) => {
    setProfile((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user) return;

    if (!profile.display_name.trim() || !profile.handle.trim()) {
        toast.error("Display Name and Handle are required.");
        return;
    }
    
    setSaving(true);
    try {
      const baseData = {
        id: user.id, // Explicitly set for insert
        display_name: profile.display_name.trim(),
        handle: profile.handle.trim(),
        bio: profile.bio.trim() || null, 
        is_private: profile.is_private,
        show_online_status: profile.show_online_status,
        show_read_receipts: profile.show_read_receipts,
        created_at: hasProfileRow ? undefined : new Date().toISOString(), // Only set on insert
        updated_at: new Date().toISOString(),
      };

      let operation;
      if (hasProfileRow) {
        // Update existing
        operation = supabase
          .from('profiles')
          .update(baseData)
          .eq('id', user.id);
      } else {
        // Insert new
        operation = supabase
          .from('profiles')
          .insert(baseData);
      }

      const { error } = await operation;

      if (error) throw error;

      toast.success('Profile updated successfully!');
      navigate(`/${user.id}`);
    } catch (error:
