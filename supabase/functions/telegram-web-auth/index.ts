import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegramIdentifier, mode } = await req.json();
    
    console.log('Telegram web auth request:', { telegramIdentifier, mode });

    if (!telegramIdentifier) {
      return new Response(
        JSON.stringify({ error: 'Telegram identifier is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean the identifier (remove @ if present)
    const cleanIdentifier = telegramIdentifier.replace('@', '').trim();
    
    // Check if it's a phone number or username
    const isPhoneNumber = /^\+?\d+$/.test(cleanIdentifier);
    
    console.log('Looking up telegram user:', { cleanIdentifier, isPhoneNumber });

    // Look up the telegram user
    let query = supabase.from('telegram_users').select('*');
    
    if (isPhoneNumber) {
      // For phone numbers, we'd need to match against profiles
      // First get telegram users that are linked
      const { data: linkedUsers, error: linkedError } = await supabase
        .from('telegram_users')
        .select(`
          *,
          profiles:user_id (
            id,
            phone_number,
            display_name,
            handle
          )
        `)
        .eq('is_linked', true);

      if (linkedError) {
        console.error('Error fetching linked users:', linkedError);
        throw linkedError;
      }

      // Find user with matching phone number
      const matchedUser = linkedUsers?.find(u => {
        const profile = u.profiles as any;
        if (profile?.phone_number) {
          const cleanPhone = profile.phone_number.replace(/\D/g, '');
          const searchPhone = cleanIdentifier.replace(/\D/g, '');
          return cleanPhone.includes(searchPhone) || searchPhone.includes(cleanPhone);
        }
        return false;
      });

      if (matchedUser) {
        const profile = matchedUser.profiles as any;
        // Generate credentials based on telegram_id
        const email = `telegram_${matchedUser.telegram_id}@afuchat.telegram`;
        const password = `tg_secure_${matchedUser.telegram_id}_${matchedUser.created_at.replace(/\D/g, '').slice(0, 10)}`;

        console.log('Found user by phone number:', matchedUser.telegram_id);

        return new Response(
          JSON.stringify({
            success: true,
            email,
            password,
            telegramId: matchedUser.telegram_id,
            displayName: profile?.display_name || matchedUser.telegram_first_name,
            handle: profile?.handle
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Search by telegram username
      const { data: telegramUser, error: fetchError } = await supabase
        .from('telegram_users')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            handle
          )
        `)
        .ilike('telegram_username', cleanIdentifier)
        .eq('is_linked', true)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching telegram user:', fetchError);
        throw fetchError;
      }

      if (telegramUser) {
        const profile = telegramUser.profiles as any;
        // Generate credentials based on telegram_id
        const email = `telegram_${telegramUser.telegram_id}@afuchat.telegram`;
        const password = `tg_secure_${telegramUser.telegram_id}_${telegramUser.created_at.replace(/\D/g, '').slice(0, 10)}`;

        console.log('Found user by username:', telegramUser.telegram_id);

        return new Response(
          JSON.stringify({
            success: true,
            email,
            password,
            telegramId: telegramUser.telegram_id,
            displayName: profile?.display_name || telegramUser.telegram_first_name,
            handle: profile?.handle
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // User not found
    console.log('Telegram user not found');
    return new Response(
      JSON.stringify({ 
        notFound: true,
        error: mode === 'signin' 
          ? 'No account linked to this Telegram. Please link your account first via @AfuChatBot'
          : 'Please complete signup via @AfuChatBot first'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Telegram web auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
