import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[delete-user-account] Processing request...');

    // Create Supabase client with the user's token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[delete-user-account] No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[delete-user-account] Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[delete-user-account] Deleting account for user:', user.id);

    // Delete user data in order (to respect foreign key constraints)
    
    // Delete message reactions
    await supabase.from('message_reactions').delete().eq('user_id', user.id);
    
    // Delete message status
    await supabase.from('message_status').delete().eq('user_id', user.id);
    
    // Delete messages sent by user
    await supabase.from('messages').delete().eq('sender_id', user.id);
    
    // Delete chat memberships
    await supabase.from('chat_members').delete().eq('user_id', user.id);
    
    // Delete chats created by user
    await supabase.from('chats').delete().eq('created_by', user.id);
    
    // Delete post acknowledgments
    await supabase.from('post_acknowledgments').delete().eq('user_id', user.id);
    
    // Delete post replies
    await supabase.from('post_replies').delete().eq('author_id', user.id);
    
    // Delete post images
    const { data: userPosts } = await supabase.from('posts').select('id').eq('author_id', user.id);
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(p => p.id);
      await supabase.from('post_images').delete().in('post_id', postIds);
      await supabase.from('post_link_previews').delete().in('post_id', postIds);
    }
    
    // Delete posts
    await supabase.from('posts').delete().eq('author_id', user.id);
    
    // Delete follows
    await supabase.from('follows').delete().eq('follower_id', user.id);
    await supabase.from('follows').delete().eq('following_id', user.id);
    
    // Delete tips
    await supabase.from('tips').delete().eq('sender_id', user.id);
    await supabase.from('tips').delete().eq('receiver_id', user.id);
    
    // Delete gifts
    await supabase.from('gift_transactions').delete().eq('sender_id', user.id);
    await supabase.from('gift_transactions').delete().eq('receiver_id', user.id);
    
    // Delete red envelopes
    await supabase.from('red_envelope_claims').delete().eq('claimer_id', user.id);
    await supabase.from('red_envelopes').delete().eq('sender_id', user.id);
    
    // Delete game data
    await supabase.from('game_scores').delete().eq('user_id', user.id);
    await supabase.from('game_sessions').delete().eq('player_id', user.id);
    await supabase.from('game_challenges').delete().eq('challenger_id', user.id);
    await supabase.from('game_challenges').delete().eq('opponent_id', user.id);
    
    // Delete shop purchases and listings
    await supabase.from('marketplace_listings').delete().eq('user_id', user.id);
    await supabase.from('user_shop_purchases').delete().eq('user_id', user.id);
    await supabase.from('bids').delete().eq('user_id', user.id);
    
    // Delete notifications
    await supabase.from('notifications').delete().eq('user_id', user.id);
    await supabase.from('notifications').delete().eq('actor_id', user.id);
    
    // Delete user achievements and activity
    await supabase.from('user_achievements').delete().eq('user_id', user.id);
    await supabase.from('user_activity_log').delete().eq('user_id', user.id);
    
    // Delete ACoin transactions
    await supabase.from('acoin_transactions').delete().eq('user_id', user.id);
    
    // Delete XP transfers
    await supabase.from('xp_transfers').delete().eq('sender_id', user.id);
    await supabase.from('xp_transfers').delete().eq('receiver_id', user.id);
    
    // Delete referrals
    await supabase.from('referrals').delete().eq('referrer_id', user.id);
    await supabase.from('referrals').delete().eq('referred_id', user.id);
    
    // Delete push subscriptions
    await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
    
    // Delete security alerts
    await supabase.from('security_alerts').delete().eq('user_id', user.id);
    
    // Delete active sessions
    await supabase.from('active_sessions').delete().eq('user_id', user.id);
    
    // Delete login history
    await supabase.from('login_history').delete().eq('user_id', user.id);
    
    // Delete stories
    await supabase.from('story_views').delete().eq('viewer_id', user.id);
    await supabase.from('stories').delete().eq('user_id', user.id);
    
    // Delete affiliate requests
    await supabase.from('affiliate_requests').delete().eq('user_id', user.id);
    
    // Delete verification requests
    await supabase.from('verification_requests').delete().eq('user_id', user.id);
    
    // Delete mini program installations
    await supabase.from('user_mini_programs').delete().eq('user_id', user.id);
    
    // Delete profile
    await supabase.from('profiles').delete().eq('id', user.id);
    
    // Finally, delete the auth user (requires service role key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteAuthError) {
      console.error('[delete-user-account] Error deleting auth user:', deleteAuthError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete authentication record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[delete-user-account] Account successfully deleted');

    return new Response(
      JSON.stringify({ success: true, message: 'Account permanently deleted' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[delete-user-account] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
