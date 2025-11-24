import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { giftId, giftName, emoji, rarity } = await req.json();
    
    if (!giftId || !giftName || !emoji) {
      throw new Error('Gift ID, name and emoji are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if gift already has a generated image
    const { data: existingGift } = await supabase
      .from('gifts')
      .select('image_url')
      .eq('id', giftId)
      .single();

    if (existingGift?.image_url) {
      console.log('Using cached image for gift:', giftId);
      return new Response(
        JSON.stringify({ imageUrl: existingGift.image_url }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const RUNWARE_API_KEY = Deno.env.get('RUNWARE_API_KEY');
    if (!RUNWARE_API_KEY) {
      throw new Error('RUNWARE_API_KEY is not configured');
    }

    // Create a detailed prompt based on rarity with animated effects
    const rarityStyles = {
      common: 'clean design, soft colors, gentle ambient glow, subtle floating particles',
      uncommon: 'polished 3D render, vibrant colors, animated particle effects, refined shimmering details',
      rare: 'stunning 3D artwork, rich metallic colors, dynamic animated lighting, floating sparkles and animated light rays, glowing edges',
      epic: 'epic cinematic quality, dramatic pulsing lights, glowing animated magical auras, swirling energy particles, holographic animated effects',
      legendary: 'legendary masterpiece, radiant animated golden light beams, intense pulsing magical energy, ethereal animated glow, divine animated sparkles, premium luxury animated effects'
    };

    const style = rarityStyles[rarity as keyof typeof rarityStyles] || rarityStyles.common;
    
    const prompt = `Create a 3D rendered ${giftName} gift object ONLY. Style: ${style}. 

CRITICAL TRANSPARENCY REQUIREMENTS - READ CAREFULLY:
- ABSOLUTE ZERO BACKGROUND - Pure 100% transparent PNG with full alpha channel
- NO background elements whatsoever - no floors, no surfaces, no environments, no gradients
- NO shadows on background - only object self-shadows
- NO backdrop - the gift object must float in complete void/transparency
- The ONLY thing visible should be the gift object itself
- PNG with full alpha transparency - everything except the gift object must be completely transparent (alpha = 0)

Object Requirements:
- Single centered 3D gift object floating in transparent space
- Professional product photography lighting on the object only
- ${style} applied to the gift object itself
- High detail and premium appearance
- The ${emoji} should inspire the object design
- Size: 512x512px
- The gift should be the ONLY visible element - everything else must be transparent

VERIFY: After generation, only the gift object should be visible. All surrounding pixels must be fully transparent (alpha channel = 0).`;

    console.log('Generating image with Runware:', prompt);

    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          taskType: "authentication",
          apiKey: RUNWARE_API_KEY
        },
        {
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          positivePrompt: prompt,
          width: 512,
          height: 512,
          model: "runware:100@1",
          numberResults: 1,
          outputFormat: "PNG",
          CFGScale: 1,
          scheduler: "FlowMatchEulerDiscreteScheduler",
          steps: 4
        }
      ])
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Runware API error:', response.status, errorText);
      throw new Error(`Runware API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.find((item: any) => item.taskType === 'imageInference')?.imageURL;

    if (!imageUrl) {
      throw new Error('No image data in response');
    }

    console.log('Image generated successfully');

    // Save the image URL to the database
    await supabase
      .from('gifts')
      .update({ image_url: imageUrl })
      .eq('id', giftId);

    console.log('Image URL saved to database');

    return new Response(
      JSON.stringify({ imageUrl }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating gift image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: true 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
