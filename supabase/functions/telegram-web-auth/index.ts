import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const cleanIdentifier = telegramIdentifier.replace('@', '').trim();
    const isPhoneNumber = /^\+?\d+$/.test(cleanIdentifier);
    
    console.log('Looking up telegram user:', { cleanIdentifier, isPhoneNumber });

    let telegramUser: any = null;
    let profile: any = null;

    if (isPhoneNumber) {
      const { data: linkedUsers, error: linkedError } = await supabase
        .from('telegram_users')
        .select(`*, profiles:user_id (id, phone_number, display_name, handle, avatar_url)`)
        .eq('is_linked', true);

      if (linkedError) throw linkedError;

      const matchedUser = linkedUsers?.find(u => {
        const p = u.profiles as any;
        if (p?.phone_number) {
          const cleanPhone = p.phone_number.replace(/\D/g, '');
          const searchPhone = cleanIdentifier.replace(/\D/g, '');
          return cleanPhone.includes(searchPhone) || searchPhone.includes(cleanPhone);
        }
        return false;
      });

      if (matchedUser) {
        telegramUser = matchedUser;
        profile = matchedUser.profiles;
      }
    } else {
      const { data, error } = await supabase
        .from('telegram_users')
        .select(`*, profiles:user_id (id, display_name, handle, avatar_url)`)
        .ilike('telegram_username', cleanIdentifier)
        .eq('is_linked', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        telegramUser = data;
        profile = data.profiles;
      }
    }

    if (!telegramUser || !telegramUser.user_id) {
      console.log('Telegram user not found or not linked');
      return new Response(
        JSON.stringify({ 
          notFound: true,
          error: mode === 'signin' 
            ? 'No account linked to this Telegram. Please link your account first via @AfuChatBot'
            : 'Please complete signup via @AfuChatBot first'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found linked telegram user:', telegramUser.telegram_id, 'user_id:', telegramUser.user_id);

    // Get the existing auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(telegramUser.user_id);
    
    if (authError || !authUser?.user) {
      console.error('Auth user not found:', authError);
      return new Response(
        JSON.stringify({ error: 'User account not found. Please contact support.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate a magic link for the user (valid for 1 hour)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email!,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://afuchat.com'}/home`
      }
    });

    if (linkError) {
      console.error('Error generating magic link:', linkError);
      throw linkError;
    }

    console.log('Generated magic link for user:', telegramUser.user_id);

    // Extract the token from the magic link
    const magicLinkUrl = new URL(linkData.properties.action_link);
    const token = magicLinkUrl.searchParams.get('token');
    const type = magicLinkUrl.searchParams.get('type');

    return new Response(
      JSON.stringify({
        success: true,
        magicLink: linkData.properties.action_link,
        token,
        type,
        email: authUser.user.email,
        telegramId: telegramUser.telegram_id,
        displayName: profile?.display_name || telegramUser.telegram_first_name,
        handle: profile?.handle
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
