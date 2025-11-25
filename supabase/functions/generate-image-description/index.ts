import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64 } = await req.json();

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Either imageUrl or imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare the image content for Gemini
    let imagePart;
    if (imageBase64) {
      const base64Data = imageBase64.startsWith('data:') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      const mimeType = imageBase64.startsWith('data:') 
        ? imageBase64.split(';')[0].split(':')[1]
        : 'image/jpeg';
      
      imagePart = {
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      };
    } else {
      // Gemini requires base64, so we need to fetch and convert the URL
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      imagePart = {
        inline_data: {
          mime_type: imageBlob.type || 'image/jpeg',
          data: base64
        }
      };
    }

    console.log("Calling Gemini AI for image description...");

    // Call Gemini AI with vision capabilities
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "You are an accessibility expert that generates concise, descriptive alt text for images. Focus on the main subject, actions, and relevant details. Keep descriptions under 125 characters when possible, but be thorough when needed. Do not start with 'An image of' or 'A picture of' - just describe what you see. Generate accessible alt text for this image. Be specific and descriptive."
                },
                imagePart
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 400 && errorText.includes('API_KEY')) {
        return new Response(
          JSON.stringify({ error: "Invalid Gemini API key" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate description" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error("Invalid Gemini response:", data);
      return new Response(
        JSON.stringify({ error: "No description generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const description = data.candidates[0].content.parts[0].text.trim();

    if (!description) {
      console.error("No description in response:", data);
      return new Response(
        JSON.stringify({ error: "No description generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generated description:", description);

    return new Response(
      JSON.stringify({ 
        description,
        success: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating image description:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
