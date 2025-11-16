import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the URL to extract metadata
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const html = await response.text();
    
    // Extract Open Graph and meta tags
    const getMetaContent = (name: string, property: string = name): string | null => {
      const metaRegex = new RegExp(`<meta[^>]*(?:name|property)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = html.match(metaRegex);
      return match ? match[1] : null;
    };

    const title = 
      getMetaContent('og:title') || 
      getMetaContent('twitter:title') ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
      '';

    const description = 
      getMetaContent('og:description') ||
      getMetaContent('twitter:description') ||
      getMetaContent('description') ||
      '';

    const imageUrl = 
      getMetaContent('og:image') ||
      getMetaContent('twitter:image') ||
      '';

    const siteName = 
      getMetaContent('og:site_name') ||
      new URL(url).hostname;

    return new Response(
      JSON.stringify({
        url,
        title: title.substring(0, 200),
        description: description.substring(0, 500),
        image_url: imageUrl,
        site_name: siteName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Failed to fetch link preview' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
