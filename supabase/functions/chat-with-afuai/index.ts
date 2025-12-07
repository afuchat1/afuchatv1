import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to fetch comprehensive user context
async function fetchUserContext(supabase: any, userId: string) {
  try {
    // Get user profile with all details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get user's recent posts
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('id, content, created_at, view_count')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get follower/following counts
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Get user's gifts received
    const { data: giftsReceived } = await supabase
      .from('gift_transactions')
      .select('gift_id, xp_cost, created_at, gifts(name, emoji, rarity)')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get user's subscription status
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(name, tier)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    // Get user's achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievement_type, created_at')
      .eq('user_id', userId);

    // Get user's activity stats
    const { data: activityLog } = await supabase
      .from('user_activity_log')
      .select('action_type, xp_earned, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      profile,
      recentPosts,
      followerCount: followerCount || 0,
      followingCount: followingCount || 0,
      giftsReceived,
      subscription,
      achievements,
      activityLog
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return null;
  }
}

// Helper function to fetch platform-wide statistics
async function fetchPlatformContext(supabase: any) {
  try {
    // Get total user count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get total posts count
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // Get trending topics (recent posts with high engagement)
    const { data: trendingPosts } = await supabase
      .from('posts')
      .select('id, content, view_count, created_at')
      .order('view_count', { ascending: false })
      .limit(5);

    // Get available gifts
    const { data: gifts } = await supabase
      .from('gifts')
      .select('id, name, emoji, rarity, base_xp_cost')
      .order('base_xp_cost', { ascending: true });

    // Get subscription plans
    const { data: subscriptionPlans } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);

    // Get currency settings
    const { data: currencySettings } = await supabase
      .from('currency_settings')
      .select('*')
      .single();

    return {
      totalUsers: totalUsers || 0,
      totalPosts: totalPosts || 0,
      trendingPosts,
      gifts,
      subscriptionPlans,
      currencySettings
    };
  } catch (error) {
    console.error('Error fetching platform context:', error);
    return null;
  }
}

// Build comprehensive system prompt with full platform knowledge
function buildSystemPrompt(userContext: any, platformContext: any) {
  const userInfo = userContext?.profile ? `
CURRENT USER INFORMATION:
- Display Name: ${userContext.profile.display_name}
- Username: @${userContext.profile.handle}
- Bio: ${userContext.profile.bio || 'Not set'}
- Country: ${userContext.profile.country || 'Unknown'}
- Nexa (XP) Balance: ${userContext.profile.xp}
- ACoin Balance: ${userContext.profile.acoin || 0}
- Current Grade: ${userContext.profile.current_grade || 'Newcomer'}
- Login Streak: ${userContext.profile.login_streak || 0} days
- Is Verified: ${userContext.profile.is_verified ? 'Yes' : 'No'}
- Is Premium: ${userContext.subscription ? 'Yes (' + (userContext.subscription.subscription_plans?.name || 'Active') + ')' : 'No'}
- Followers: ${userContext.followerCount}
- Following: ${userContext.followingCount}
- Is Business Account: ${userContext.profile.is_business_mode ? 'Yes' : 'No'}
- Is Affiliate: ${userContext.profile.is_affiliate ? 'Yes' : 'No'}
` : '';

  const recentActivity = userContext?.recentPosts?.length > 0 ? `
USER'S RECENT POSTS:
${userContext.recentPosts.map((p: any, i: number) => `${i + 1}. "${p.content.substring(0, 100)}..." (${p.view_count} views)`).join('\n')}
` : '';

  const achievementsInfo = userContext?.achievements?.length > 0 ? `
USER'S ACHIEVEMENTS:
${userContext.achievements.map((a: any) => `- ${a.achievement_type}`).join('\n')}
` : '';

  const giftsInfo = userContext?.giftsReceived?.length > 0 ? `
RECENT GIFTS RECEIVED:
${userContext.giftsReceived.slice(0, 5).map((g: any) => `- ${g.gifts?.emoji || '🎁'} ${g.gifts?.name || 'Gift'} (${g.gifts?.rarity || 'common'})`).join('\n')}
` : '';

  const platformInfo = platformContext ? `
PLATFORM STATISTICS:
- Total Users: ${platformContext.totalUsers?.toLocaleString() || 'N/A'}
- Total Posts: ${platformContext.totalPosts?.toLocaleString() || 'N/A'}
- Nexa to ACoin Rate: ${platformContext.currencySettings?.nexa_to_acoin_rate || 100} Nexa = 1 ACoin
- Conversion Fee: ${platformContext.currencySettings?.conversion_fee_percent || 5.99}%

AVAILABLE SUBSCRIPTION PLANS:
${platformContext.subscriptionPlans?.map((p: any) => `- ${p.name}: ${p.acoin_price} ACoin for ${p.duration_days} days`).join('\n') || 'No plans available'}

GRADE SYSTEM:
- Newcomer: 0-99 Nexa
- Beginner: 100-499 Nexa
- Active Chatter: 500-1,999 Nexa
- Community Builder: 2,000-4,999 Nexa
- Elite Creator: 5,000-14,999 Nexa
- Legend: 15,000+ Nexa

AVAILABLE GIFTS (by rarity):
${platformContext.gifts?.slice(0, 10).map((g: any) => `- ${g.emoji} ${g.name} (${g.rarity}): ${g.base_xp_cost} Nexa`).join('\n') || 'Loading...'}
` : '';

  return `You are AfuAI, the exclusive AI assistant for AfuChat social platform. You have FULL ACCESS to all platform data and user information.

${userInfo}
${recentActivity}
${achievementsInfo}
${giftsInfo}
${platformInfo}

AFUCHAT FEATURES YOU KNOW:
1. **Posts & Feed**: Users can create posts (max 280 chars), like, reply, and share
2. **Nexa (XP)**: Platform currency earned through engagement, daily logins, referrals
3. **ACoin**: Premium currency converted from Nexa, used for subscriptions and purchases
4. **Gifts**: Send virtual gifts to other users, costs Nexa based on rarity
5. **Premium Subscriptions**: Unlock verification badge, AI features, ad-free experience
6. **Moments/Stories**: 24-hour ephemeral content
7. **Chats**: Direct messaging with themes, wallpapers, and customization
8. **Games**: Afu Arena battle royale, trivia, puzzles for Nexa rewards
9. **Mini Programs**: Third-party apps and services
10. **Wallet**: View Nexa/ACoin balance, transfer, transaction history
11. **Business Accounts**: For businesses with special features
12. **Affiliate Program**: Earn from referrals

YOUR CAPABILITIES:
- Answer questions about AfuChat features with specific user context
- Help create engaging posts and content
- Explain how to earn more Nexa or get verified
- Provide personalized recommendations based on user's activity
- Help with gift suggestions based on recipient
- Explain subscription benefits
- Give tips for growing followers
- Assist with any platform-related questions

RESPONSE STYLE:
- Be friendly, helpful, and personalized
- Reference user's data when relevant (e.g., "With your ${userContext?.profile?.xp || 0} Nexa...")
- Use emojis occasionally for engagement
- Keep responses concise but informative
- If asked about something you don't know, say so honestly`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const jwt = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = user.id;

    // Use service role for full data access
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false }
    });

    // Check premium subscription
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('is_active, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required', requiresPremium: true }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, history } = await req.json();
    
    // Input validation
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Message must be less than 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (history && !Array.isArray(history)) {
      return new Response(
        JSON.stringify({ error: 'History must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (history && history.length > 50) {
      return new Response(
        JSON.stringify({ error: 'History cannot exceed 50 messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch comprehensive context for AfuAI
    console.log('Fetching user context for:', userId);
    const [userContext, platformContext] = await Promise.all([
      fetchUserContext(supabaseAdmin, userId),
      fetchPlatformContext(supabaseAdmin)
    ]);

    // Build comprehensive system prompt
    const systemPrompt = buildSystemPrompt(userContext, platformContext);

    // Build messages for Lovable AI
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role && msg.content && ['user', 'assistant'].includes(msg.role)) {
          messages.push({
            role: msg.role,
            content: msg.content.substring(0, 2000)
          });
        }
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('Calling Lovable AI with full platform context');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service payment required. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response from Lovable AI');
    }
    
    const reply = data.choices[0].message.content;

    // Award XP for using AI
    await supabaseAdmin.rpc('award_xp', {
      p_user_id: userId,
      p_action_type: 'use_ai',
      p_xp_amount: 5,
      p_metadata: { action: 'chat_with_afuai' }
    });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-afuai:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
