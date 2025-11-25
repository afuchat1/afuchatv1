import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });
    
    // Use Supabase's built-in method to get user instead of manually parsing JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = user.id;

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
    
    if (history) {
      for (const msg of history) {
        if (!msg.role || !msg.content) {
          return new Response(
            JSON.stringify({ error: 'Invalid history format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!['user', 'assistant'].includes(msg.role)) {
          return new Response(
            JSON.stringify({ error: 'Invalid role in history' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (msg.content.length > 2000) {
          return new Response(
            JSON.stringify({ error: 'History message too long' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    const AIMLAPI_KEY = Deno.env.get('AIMLAPI_KEY');
    
    if (!AIMLAPI_KEY) {
      throw new Error('AIMLAPI_KEY not configured');
    }

    // Build messages for AIMLAPI
    const messages = [
      {
        role: 'system',
        content: `You are AfuAI, a helpful AI assistant for AfuChat social platform.
You help users:
- Create engaging posts (suggest topics, write drafts, improve content)
- Answer questions about AfuChat features
- Provide general assistance and conversation

Be friendly, concise, and helpful. Use emojis occasionally to be more engaging.
Keep responses under 300 characters when possible.`
      }
    ];

    // Add conversation history
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIMLAPI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AIMLAPI error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ 
          error: 'Invalid AIMLAPI key. Please check your API key configuration.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AIMLAPI error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response from AIMLAPI');
    }
    
    const reply = data.choices[0].message.content;

    // Award XP for using AI
    await supabaseClient.rpc('award_xp', {
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
