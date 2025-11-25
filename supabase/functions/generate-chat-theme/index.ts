import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    // Check if user is premium
    const { data: subscription } = await supabaseClient
      .from('user_subscriptions')
      .select('is_active, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!subscription) {
      return new Response(JSON.stringify({ error: 'Premium subscription required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, prompt } = await req.json();

    if (!type || !prompt) {
      throw new Error('Type and prompt are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (type === 'theme') {
      // Generate theme colors using AI
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
              content: 'You are a professional UI/UX color palette designer. Generate beautiful, harmonious chat theme colors based on user descriptions. Return ONLY a JSON object with primary, secondary, and accent colors in hex format.'
            },
            {
              role: 'user',
              content: `Generate a chat theme color palette for: "${prompt}". Return JSON with format: {"primary": "#hexcolor", "secondary": "#hexcolor", "accent": "#hexcolor"}`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_theme_colors",
              description: "Generate theme color palette",
              parameters: {
                type: "object",
                properties: {
                  primary: { type: "string", description: "Primary color in hex format" },
                  secondary: { type: "string", description: "Secondary color in hex format" },
                  accent: { type: "string", description: "Accent color in hex format" }
                },
                required: ["primary", "secondary", "accent"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "generate_theme_colors" } }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API Error:', response.status, errorText);
        throw new Error(`AI API error: ${response.status}`);
      }

      const aiData = await response.json();
      const colors = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);

      // Check if theme already exists
      const { data: existing } = await supabaseClient
        .from('chat_themes')
        .select('id')
        .eq('generated_prompt', prompt)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ id: existing.id, colors, name: prompt }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Store in database
      const { data: theme, error: insertError } = await supabaseClient
        .from('chat_themes')
        .insert({
          name: prompt,
          colors,
          generated_prompt: prompt,
          is_premium: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify(theme), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (type === 'wallpaper') {
      // Generate wallpaper image using AI
      const response = await fetch('https://api.runware.ai/v1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RUNWARE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          taskType: 'imageInference',
          taskUUID: crypto.randomUUID(),
          model: 'runware:100@1',
          positivePrompt: `${prompt}, abstract chat wallpaper background, high quality, seamless pattern, professional design, 4K`,
          negativePrompt: 'text, watermark, signature, low quality, blurry',
          width: 1024,
          height: 1024,
          numberResults: 1,
          outputFormat: 'PNG',
        }]),
      });

      if (!response.ok) {
        throw new Error(`Runware API error: ${response.status}`);
      }

      const imageData = await response.json();
      const imageUrl = imageData[0]?.imageURL;

      if (!imageUrl) {
        throw new Error('No image generated');
      }

      // Check if wallpaper already exists
      const { data: existing } = await supabaseClient
        .from('chat_wallpapers')
        .select('id')
        .eq('generated_prompt', prompt)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ id: existing.id, image_url: imageUrl, name: prompt }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Store in database
      const { data: wallpaper, error: insertError } = await supabaseClient
        .from('chat_wallpapers')
        .insert({
          name: prompt,
          image_url: imageUrl,
          generated_prompt: prompt,
          is_premium: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify(wallpaper), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid type');

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});