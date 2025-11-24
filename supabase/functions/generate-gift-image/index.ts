import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { giftName, emoji, rarity } = await req.json();
    
    if (!giftName || !emoji) {
      throw new Error('Gift name and emoji are required');
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    // Create a detailed prompt based on rarity with better visual descriptions
    const rarityStyles = {
      common: 'clean and simple design, soft pastel colors, gentle glow, minimalist aesthetic',
      uncommon: 'polished 3D render, vibrant colors, subtle particle effects, refined details',
      rare: 'stunning 3D artwork, rich colors with metallic accents, dynamic lighting, floating sparkles and light rays',
      epic: 'epic cinematic quality, dramatic lighting, glowing magical auras, swirling energy particles, holographic effects',
      legendary: 'legendary masterpiece, radiant golden light beams, intense magical energy, ethereal glow, divine sparkles, premium luxury feel'
    };

    const style = rarityStyles[rarity as keyof typeof rarityStyles] || rarityStyles.common;
    
    const prompt = `Create an ultra-realistic, beautiful 3D digital gift of ${giftName}. Style: ${style}. 

Requirements:
- High-quality product photography style with professional studio lighting
- Completely transparent background (PNG format)
- Centered composition with the gift floating gracefully
- Soft shadows beneath the item for depth
- Premium, gift-worthy appearance with attention to detail
- Size: 512x512px
- Make it look like a real, tangible luxury gift item
- Add appropriate visual effects based on rarity (sparkles, glow, particles)
- The ${emoji} should inspire the design but make it realistic and beautiful

Make this look like an expensive digital gift that someone would be excited to receive!`;

    console.log('Generating image with prompt:', prompt);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log('Image generated successfully');

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
