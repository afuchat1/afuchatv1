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

// Fetch user's AI memories (with cleanup of expired ones)
async function fetchUserMemories(supabase: any, userId: string) {
  try {
    // First, cleanup expired memories for this user
    await supabase
      .from('ai_memories')
      .delete()
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString());

    // Fetch active memories
    const { data: memories } = await supabase
      .from('ai_memories')
      .select('content, memory_type, metadata, created_at')
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    return memories || [];
  } catch (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
}

// Extract and store new memories from conversation
async function storeMemories(supabase: any, userId: string, userMessage: string, aiReply: string) {
  try {
    const memoriesToStore = [];

    // Store user preferences/interests mentioned
    const interestPatterns = [
      /i (?:like|love|enjoy|prefer|want|need) (.+?)(?:\.|$)/gi,
      /my (?:favorite|fav) (?:is|are) (.+?)(?:\.|$)/gi,
      /i(?:'m| am) (?:interested in|looking for) (.+?)(?:\.|$)/gi,
    ];

    for (const pattern of interestPatterns) {
      const matches = userMessage.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length < 200) {
          memoriesToStore.push({
            user_id: userId,
            memory_type: 'preference',
            content: match[1].trim(),
            metadata: { source: 'user_message' },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    }

    // Store conversation context summary
    if (userMessage.length > 20) {
      memoriesToStore.push({
        user_id: userId,
        memory_type: 'conversation',
        content: `User asked: "${userMessage.substring(0, 150)}${userMessage.length > 150 ? '...' : ''}"`,
        metadata: { 
          ai_response_preview: aiReply.substring(0, 100),
          timestamp: new Date().toISOString()
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Store important facts the user mentions about themselves
    const factPatterns = [
      /i(?:'m| am) (?:a |an )?(.+?)(?:and|but|\.|,|$)/gi,
      /i work (?:as|at|in|for) (.+?)(?:\.|$)/gi,
      /my name is (.+?)(?:\.|$)/gi,
    ];

    for (const pattern of factPatterns) {
      const matches = userMessage.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2 && match[1].length < 100) {
          memoriesToStore.push({
            user_id: userId,
            memory_type: 'fact',
            content: match[1].trim(),
            metadata: { source: 'self_description' },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    }

    // Batch insert memories
    if (memoriesToStore.length > 0) {
      await supabase.from('ai_memories').insert(memoriesToStore);
      console.log(`Stored ${memoriesToStore.length} memories for user ${userId}`);
    }
  } catch (error) {
    console.error('Error storing memories:', error);
  }
}

// Build comprehensive system prompt with full platform knowledge
function buildSystemPrompt(userContext: any, platformContext: any, memories: any[]) {
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

  // Format memories for context
  const memoriesInfo = memories.length > 0 ? `
YOUR MEMORIES ABOUT THIS USER (from past conversations, expires after 7 days):
${memories.slice(0, 20).map((m: any) => {
  const type = m.memory_type === 'preference' ? '💡 Preference' : 
               m.memory_type === 'fact' ? '📝 Fact' : '💬 Context';
  return `- ${type}: ${m.content}`;
}).join('\n')}
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

  return `You are AfuAI, the exclusive AI assistant for AfuChat social platform. You have FULL ACCESS to all platform data and user information. You are the MASTER of every single detail in the app.

You have PERSISTENT MEMORY that lasts 7 days. Use your memories to personalize responses and remember what users told you previously.

${userInfo}
${recentActivity}
${achievementsInfo}
${giftsInfo}
${memoriesInfo}
${platformInfo}

=== COMPLETE AFUCHAT PLATFORM KNOWLEDGE ===

**MAIN PAGES & NAVIGATION:**
- Landing Page: / - Welcome page for new users, shows app features
- Home Feed: /home - Main feed with posts from followed users and For You
- Search: /search - Find users, posts, hashtags, and groups
- Notifications: /notifications - All your notifications (likes, follows, mentions)
- Profile: /@username or /profile/:id - View user profiles
- Chats: /chats - All your conversations
- Chat Room: /chat/:id - Individual chat conversation

**PREMIUM & SUBSCRIPTION:**
- Premium Page: /premium - View and purchase premium subscriptions
- Premium gives: Verified badge, AI features (like me!), ad-free experience, priority support
- Premium users can create stories, groups, and access exclusive features

**FINANCIAL FEATURES:**
- Wallet: /wallet - View Nexa/ACoin balance, transaction history
- Transfer: /transfer - Send Nexa/ACoin to other users
- Financial Hub: /financial-hub - Complete financial overview

**CREATOR EARNINGS PROGRAM (Uganda Only):**
- Creator Earnings: /creator-earnings - Daily 5,000 UGX giveaway for Ugandan creators
- Eligibility: Uganda account, 10+ followers, 500+ weekly views
- Distribution: Daily automatic based on engagement (views + likes)
- Withdrawals: Mobile Money (MTN/Airtel), minimum 5,000 UGX, weekends only
- 10% platform fee on withdrawals, admin approval required

**GIFTS & MARKETPLACE:**
- Gifts: /gifts - Browse and send virtual gifts to users
- Gift Detail: /gift/:id - View specific gift details
- Marketplace: /marketplace - Buy/sell rare gifts from other users
- Gifts cost Nexa, rarity affects price (common, uncommon, rare, epic, legendary)

**GAMES & ENTERTAINMENT:**
- Games Hub: /games - All available games
- Afu Arena: /games/afu-arena - Battle royale multiplayer game, win 150 Nexa
- Trivia Game: /games/trivia - Knowledge quiz, earn Nexa
- Memory Game: /games/memory - Memory challenge
- Puzzle Game: /games/puzzle - Puzzle solving
- Simple Game: /games/simple - Quick casual game

**SOCIAL FEATURES:**
- Moments/Stories: /moments - View and create 24-hour stories (premium only to create)
- Followers: /followers/:id - See who follows a user
- Following: /following/:id - See who a user follows
- Suggested Users: /suggested-users - Discover new people to follow
- Trending Hashtags: /trending - Popular hashtags and topics

**SETTINGS & ACCOUNT:**
- Settings: /settings - All app settings (appearance, notifications, privacy, security)
- Edit Profile: /edit-profile - Update your profile information
- Complete Profile: /complete-profile - Finish setting up your profile
- Change Password: /change-password - Update your password
- QR Code: /qr-code - Your shareable QR code

**BUSINESS FEATURES:**
- Business Dashboard: /business-dashboard - Analytics for business accounts
- Affiliate Dashboard: /affiliate-dashboard - Affiliate earnings and stats
- Affiliate Request: /affiliate-request - Apply to become an affiliate

**SUPPORT & LEGAL:**
- Support: /support - Get help, contact support team, report issues
- Privacy Policy: /privacy - Read our privacy policy
- Terms of Use: /terms - Read our terms of service

**RED ENVELOPES:**
- Red Envelope: /red-envelope/:id - Claim red envelope rewards
- Only premium users can create red envelopes
- Non-premium users limited to 1 claim per day

**ADMIN (Admins Only):**
- Admin Dashboard: /admin - Platform administration
- Verification Requests: /admin/verification-requests - Review verification
- Creator Withdrawals: /admin/creator-withdrawals - Approve/reject withdrawals
- Affiliate Requests: /admin/affiliate-requests - Review affiliate applications

**INSTALL & PWA:**
- Install: /install - Install AfuChat as a mobile app

**CURRENCY SYSTEM:**
- Nexa (XP): Earned through engagement, daily logins, referrals, games
- ACoin: Premium currency, converted from Nexa (100 Nexa = 1 ACoin, 5.99% fee)
- Used for: Premium subscriptions, marketplace purchases

**GRADE SYSTEM:**
- Newcomer: 0-99 Nexa
- Beginner: 100-499 Nexa
- Active Chatter: 500-1,999 Nexa
- Community Builder: 2,000-4,999 Nexa
- Elite Creator: 5,000-14,999 Nexa
- Legend: 15,000+ Nexa

**REFERRAL SYSTEM:**
- Refer friends to earn 500 Nexa per successful referral
- New users get 1 week free Premium when joining via referral
- Both users get verified status automatically

**PRIVACY FEATURES:**
- Private accounts: Control who sees your content
- Hide followers/following lists
- Block and report users
- Follow requests for private accounts

**CHAT FEATURES:**
- Direct messages, group chats
- Custom themes and wallpapers (premium for AI-generated)
- Voice messages, file attachments
- Message reactions, replies
- Group chat creation (premium only)

=== HOW TO RESPOND ===

When users ask about features or pages, ALWAYS include the relevant link:
- "You can check your wallet at /wallet"
- "Visit /premium to see subscription options"
- "Go to /support if you need help"
- "Read our terms at /terms or privacy policy at /privacy"

YOUR CAPABILITIES:
- Answer ANY question about AfuChat with complete knowledge
- Direct users to exact pages with links
- Explain all features in detail
- Help create engaging posts and content
- Explain how to earn more Nexa or get verified
- Provide personalized recommendations based on user's activity
- Help with gift suggestions based on recipient
- Explain subscription benefits and pricing
- Give tips for growing followers
- Assist with any platform-related questions
- REMEMBER user preferences and past conversations for 7 days

RESPONSE STYLE:
- Be friendly, helpful, and personalized
- ALWAYS include page links when relevant (e.g., "Visit /support for help")
- Reference user's data when relevant (e.g., "With your ${userContext?.profile?.xp || 0} Nexa...")
- Reference memories when relevant (e.g., "I remember you mentioned...")
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

    // Fetch comprehensive context for AfuAI including memories
    console.log('Fetching user context for:', userId);
    const [userContext, platformContext, memories] = await Promise.all([
      fetchUserContext(supabaseAdmin, userId),
      fetchPlatformContext(supabaseAdmin),
      fetchUserMemories(supabaseAdmin, userId)
    ]);

    console.log(`Loaded ${memories.length} memories for user`);

    // Build comprehensive system prompt with memories
    const systemPrompt = buildSystemPrompt(userContext, platformContext, memories);

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

    // Store new memories from this conversation (async, don't wait)
    storeMemories(supabaseAdmin, userId, message, reply);

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
