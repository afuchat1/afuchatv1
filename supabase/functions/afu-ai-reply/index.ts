import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, replyContent, originalPostContent, triggerReplyId } = await req.json();
    
    // Input validation
    if (!postId || typeof postId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Post ID is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!replyContent || typeof replyContent !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Reply content is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (replyContent.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Reply content cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (replyContent.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Reply content must be less than 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (originalPostContent && typeof originalPostContent !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Original post content must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (originalPostContent && originalPostContent.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Original post content too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!DEEPSEEK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get AfuAI user profile
    const { data: afuAiProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', 'afuai')
      .single();

    if (profileError || !afuAiProfile) {
      console.error('AfuAI profile not found, creating one...');
      // Create AfuAI profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          display_name: 'AfuAI',
          handle: 'afuai',
          bio: '🤖 AI Assistant for AfuChat - Here to help!',
          is_verified: true,
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create AfuAI profile:', createError);
        throw createError;
      }
    }

    // Generate AI response
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are AfuAI, a helpful and friendly AI assistant for AfuChat social platform. 
            You provide concise, relevant responses to user mentions. Keep replies under 200 characters.
            Be encouraging, supportive, and helpful. Use emojis sparingly.
            Original post: "${originalPostContent}"
            User's mention: "${replyContent}"`
          },
          {
            role: 'user',
            content: replyContent
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const aiData = await response.json();
    const aiReply = aiData.choices[0].message.content;

    // Get the user who mentioned AfuAI (from the trigger reply) to award XP
    let mentioningUserId = null;
    if (triggerReplyId) {
      const { data: replyData } = await supabase
        .from('post_replies')
        .select('author_id')
        .eq('id', triggerReplyId)
        .single();
      mentioningUserId = replyData?.author_id;
    }

    // Award XP to the user who used AI (mentioned AfuAI)
    if (mentioningUserId) {
      const supabaseServiceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabaseServiceClient.rpc('award_xp', {
        p_user_id: mentioningUserId,
        p_action_type: 'use_ai',
        p_xp_amount: 5,
        p_metadata: { action: 'ai_reply', post_id: postId }
      });
    }

    // Post AI reply
    const afuAiUserId = afuAiProfile?.id || (await supabase
      .from('profiles')
      .select('id')
      .eq('handle', 'afuai')
      .single()).data?.id;

    const { error: replyError } = await supabase
      .from('post_replies')
      .insert({
        post_id: postId,
        author_id: afuAiUserId,
        content: aiReply,
      });

    if (replyError) {
      console.error('Failed to post AI reply:', replyError);
      throw replyError;
    }

    return new Response(JSON.stringify({ success: true, reply: aiReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in afu-ai-reply:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
