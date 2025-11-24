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

    const FREEPIK_API_KEY = Deno.env.get('FREEPIK_API_KEY');
    if (!FREEPIK_API_KEY) {
      throw new Error('FREEPIK_API_KEY is not configured');
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

    console.log('Creating Freepik task with prompt:', prompt);

    // Create the image generation task
    const createResponse = await fetch("https://api.freepik.com/v1/ai/text-to-image/hyperflux", {
      method: "POST",
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        aspect_ratio: "square_1_1"
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Freepik API error:', createResponse.status, errorText);
      throw new Error(`Freepik API error: ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    const taskId = createData.data?.task_id;

    if (!taskId) {
      throw new Error('No task ID returned from Freepik API');
    }

    console.log('Task created:', taskId);

    // Poll for task completion
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    let imageUrl: string | null = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(
        `https://api.freepik.com/v1/ai/text-to-image/hyperflux/${taskId}`,
        {
          headers: {
            "x-freepik-api-key": FREEPIK_API_KEY,
          }
        }
      );

      if (!statusResponse.ok) {
        console.error('Status check error:', statusResponse.status);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.data?.status;
      
      console.log(`Task status (attempt ${attempts + 1}):`, status);

      if (status === 'SUCCESS') {
        const generated = statusData.data?.generated;
        if (generated && generated.length > 0) {
          imageUrl = generated[0];
          break;
        }
      } else if (status === 'FAILED') {
        throw new Error('Image generation failed');
      }

      attempts++;
    }

    if (!imageUrl) {
      throw new Error('Image generation timeout');
    }

    console.log('Image generated successfully:', imageUrl);

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
