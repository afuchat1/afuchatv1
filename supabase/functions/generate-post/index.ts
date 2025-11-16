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
    const authHeader = req.headers.get('Authorization')!;
    
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { topic, tone, length }: { topic: string; tone: string; length: string } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const tonePrompts: Record<string, string> = {
      casual: 'casual and friendly',
      professional: 'professional and informative',
      funny: 'humorous and entertaining',
      inspiring: 'motivational and uplifting',
    };

    const lengthLimits: Record<string, string> = {
      short: '50-100 characters',
      medium: '100-200 characters',
      long: '200-280 characters',
    };

    const selectedTone = tonePrompts[tone] || 'casual and friendly';
    const selectedLength = lengthLimits[length] || 'medium';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a creative social media post writer. Generate engaging posts for AfuChat.
            Keep posts within 280 characters MAX.
            Topic: ${topic}
            Tone: ${selectedTone}
            Length: ${selectedLength}
            
            Write ONLY the post content, no quotes or extra formatting.`
          },
          {
            role: 'user',
            content: `Write a ${selectedTone} post about: ${topic}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const generatedPost = data.choices[0].message.content.trim();

    // Award XP for using AI
    await supabaseClient.rpc('award_xp', {
      p_user_id: user.id,
      p_action_type: 'use_ai',
      p_xp_amount: 5,
      p_metadata: { action: 'generate_post', topic }
    });

    // Ensure it's within 280 characters
    const finalPost = generatedPost.length > 280 
      ? generatedPost.substring(0, 277) + '...' 
      : generatedPost;

    return new Response(JSON.stringify({ post: finalPost }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-post:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
